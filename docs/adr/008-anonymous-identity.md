# ADR-008: Anonymous Identity — Device Fingerprinting

**Status**: Accepted
**Date**: 2026-02-22
**Deciders**: Core team
**Category**: Identity & Privacy

## Context

Framedle must support anonymous play — users should be able to play daily games without creating an account. However, we need a way to:

1. **Enforce daily limits**: prevent replaying the same puzzle
2. **Track local progress**: streaks, scores, history
3. **Enable future upgrade**: merge anonymous history when user registers
4. **Avoid abuse**: prevent trivial identity reset to replay games

This requires a stable anonymous identity that persists across sessions without requiring login.

## Options Considered

### Option A: Random UUID (localStorage)

- Generate `crypto.randomUUID()` on first visit, store in localStorage
- Simple, no fingerprinting libraries needed
- Trivially resetable (clear storage, incognito mode)
- No cross-device continuity
- Privacy-friendly (no hardware fingerprinting)

### Option B: Device Fingerprint (hashed) ✅ Selected

- Combine browser/device signals: user agent, screen resolution, timezone, language, installed fonts, WebGL renderer, canvas fingerprint
- Hash the combination: `SHA-256(signal1 + signal2 + ... + salt)`
- Stored locally AND sent to server for daily-lock enforcement
- Harder to reset (changing one signal changes the hash, but most are stable)
- Cross-session persistence without storage
- Can be regenerated if localStorage is cleared

### Option C: IP-based

- Use client IP address as identity
- Shared IPs (households, offices, VPNs) would conflict
- Dynamic IPs cause identity loss
- GDPR concerns with storing IP addresses
- Not viable for multi-user scenarios

### Option D: Server-generated cookie

- Server issues a secure HTTP-only cookie on first visit
- Persists across sessions (until cookie is cleared)
- Blocked by Safari ITP (7-day expiry for cross-site)
- Can't survive app reinstalls
- Cookie consent requirements in EU

## Decision

**Device fingerprinting (hashed)** — provides the best balance of persistence, abuse resistance, and privacy. The fingerprint is a one-way hash, making it impossible to reverse-engineer individual signals. Combined with a localStorage fallback, this covers most scenarios.

## Implementation

### Fingerprint Generation

```typescript
async function generateFingerprint(): Promise<string> {
  const signals = [
    navigator.userAgent,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.hardwareConcurrency?.toString() ?? '',
    getCanvasFingerprint(),
    await getWebGLRenderer(),
  ];

  const raw = signals.join('|');
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw + FINGERPRINT_SALT)
  );
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### Storage Strategy

```
1. On first visit:
   - Generate device fingerprint
   - Store in localStorage as `framedle_anon_id`
   - Register with server: POST /api/anon/register { fingerprint }

2. On subsequent visits:
   - Read from localStorage first (fast)
   - If missing (cleared), regenerate from signals
   - Reconcile with server if fingerprint changed slightly

3. On registration:
   - POST /api/user/claim-anonymous { fingerprint, clerk_user_id }
   - Server merges all game_results with matching fingerprint
   - Anonymous identity is retired (fingerprint marked as claimed)
```

### Tauri (Desktop/Mobile)

On native platforms, use the Tauri device UUID plugin for a more stable identifier:

```rust
// Tauri plugin provides hardware-based UUID
tauri_plugin_device::get_device_id()
```

This is more stable than browser fingerprinting and survives app data clears.

### Anti-Abuse Measures

1. **Fingerprint + localStorage dual check**: both must be absent to create a new identity
2. **Rate limiting**: max 3 new anonymous identities per IP per day
3. **Fingerprint similarity**: if a new fingerprint differs by only 1-2 signals from an existing one, flag for review
4. **Server-side daily lock**: `SETNX anon:{fingerprint}:{date}:{mode}` in Redis — even if local storage is cleared, the server remembers

## Consequences

### Positive

- Zero-friction play: no account required
- Daily limit enforcement without login
- Smooth upgrade path to registered account
- Works on all platforms (web, desktop, mobile)

### Negative

- Not 100% stable: browser updates, OS changes can alter fingerprint
- Privacy considerations: fingerprinting is a sensitive topic (mitigated by hashing)
- Determined cheaters can still reset (different browser + cleared storage)
- GDPR: device fingerprint may be considered personal data in some jurisdictions

### Mitigations

- Clearly disclose fingerprinting in privacy policy
- Store only the hash, never raw signals
- Provide "delete my data" API for GDPR compliance
- Accept that anonymous anti-cheat is "good enough, not perfect" — registration is the path to full integrity

## References

- [FingerprintJS](https://fingerprint.com/) — commercial fingerprinting library
- [Browser Fingerprinting: A Survey](https://arxiv.org/abs/1905.01051) — academic overview
- [GDPR and Device Fingerprinting](https://ico.org.uk/for-organisations/guide-to-pecr/cookies-and-similar-technologies/)
