# Privacy Policy

> **DRAFT — Pending Legal Review**
>
> This document is a skeleton prepared by the engineering team to identify data flows and compliance requirements. It has **not** been reviewed by legal counsel. It must not be published to users or treated as a binding legal document until reviewed and approved by a qualified lawyer. See the note at the bottom of this document.

---

**Service**: Framedle (`framedle.wtf`)
**Operator**: [Legal entity name — to be confirmed]
**Contact**: [privacy@framedle.wtf — to be set up]
**Last updated**: 2026-02-28 (draft)

---

## 1. Introduction

Framedle is a daily YouTube video guessing game available on web, desktop (Windows, macOS, Linux), and mobile (iOS, Android). This policy explains what data we collect, why we collect it, who we share it with, and what rights you have over your data.

We operate under a **VPS-first** infrastructure model: core services (API, database, cache, authentication) run on our own server. We use a limited set of third-party services for content delivery and identity management.

---

## 2. Data We Collect

### 2.1 Anonymous Players (No Account Required)

You can play Framedle without creating an account. When you play anonymously we collect:

| Data | Description | Purpose | Storage |
|------|-------------|---------|---------|
| Device fingerprint (hashed) | A SHA-256 hash derived from browser/device signals (user agent, screen resolution, timezone, language, hardware concurrency, canvas fingerprint, WebGL renderer) combined with a server-side salt. The raw signals are never stored. | Enforce one-game-per-day limit without requiring login; enable account upgrade with history intact | PostgreSQL (VPS); Valkey daily lock key |
| Game results | Mode played, guesses submitted (count only, not text), score, completion time, date | Leaderboard ranking; streak tracking; anonymous statistics | PostgreSQL (VPS) |
| localStorage token | A copy of the fingerprint hash stored in your browser's localStorage under the key `framedle_anon_id` | Fast identity lookup on return visits without re-computing the fingerprint | Your device only |

**Device fingerprinting disclosure (ADR-008)**: We use device fingerprinting as the anonymous identity mechanism. The fingerprint is a one-way hash — it cannot be reversed to recover individual device signals. We chose this approach over random cookies because cookies are blocked by Safari's Intelligent Tracking Prevention and do not survive app reinstalls on mobile. We disclose this practice here and provide a deletion path under Section 6.

### 2.2 Registered Players (Optional Account)

If you choose to create an account:

| Data | Description | Purpose | Storage |
|------|-------------|---------|---------|
| Identity provider data | Name, email address, and profile picture as returned by your chosen SSO provider (Google, Discord, Apple, GitHub, or X/Twitter) | Account creation; display name and avatar in leaderboard | Logto (self-hosted, VPS); PostgreSQL (VPS) |
| Email address | Collected if you register via email and password or magic link | Account login; transactional emails (streak reminders, if enabled) | Logto (self-hosted, VPS) |
| Display name | Chosen by you; defaults to your SSO provider name | Public leaderboard display | PostgreSQL (VPS) |
| Country (optional) | Selected by you in profile settings | Country-level leaderboard filtering | PostgreSQL (VPS) |
| Game results | Same as anonymous, but linked to your account | Full play history; achievements; XP; streak | PostgreSQL (VPS) |
| XP and achievements | Earned through gameplay | Progression system | PostgreSQL (VPS) |
| Anonymous history (if claimed) | If you played anonymously before registering and chose to merge your history | Continuity of streaks and scores | PostgreSQL (VPS) |

### 2.3 Technical Data (All Users)

| Data | Description | Retention |
|------|-------------|-----------|
| API request logs | Timestamp, HTTP method, path, status code, response time. No request body or guess text is logged. | 30 days, then deleted |
| Rate limit counters | Per-IP request counts (sliding window). Not persisted to disk. | In-memory only (Valkey); expires with the window |
| Error traces | Stack traces from server-side errors. May include request metadata but not user-supplied guess text. | 30 days |

We do **not** collect:

- The text of your guesses (only whether they were correct and how many were submitted)
- IP addresses in persistent storage
- Precise geolocation
- Browsing history outside of Framedle

---

## 3. How We Use Your Data

| Purpose | Legal Basis (GDPR) | Data Used |
|---------|-------------------|-----------|
| Enforce daily game limits | Legitimate interest (game integrity) | Device fingerprint / user ID + date + mode |
| Display leaderboards | Legitimate interest (core product feature) | Display name, score, country |
| Maintain streaks and achievements | Contract (providing the service you requested) | Game results, XP |
| Enable anonymous → registered history merge | Contract (user-initiated action) | Device fingerprint, historical game results |
| Transactional emails (if opted in) | Consent | Email address |
| Security and anti-abuse | Legitimate interest | Rate limit counters, timing metadata |
| Aggregate analytics | Legitimate interest (product improvement) | Anonymised, aggregated gameplay statistics |

We do **not** use your data for advertising. We do **not** sell your data to third parties.

---

## 4. Third-Party Services

The following third-party services receive data as part of operating Framedle.

### 4.1 Logto (Authentication)

- **Role**: Self-hosted identity and access management. Runs on our own VPS.
- **Data shared**: Email address (if email registration), name and profile picture (from SSO provider at login time), JWT tokens.
- **What they access**: Identity data only. No game results or fingerprints pass through Logto.
- **Privacy policy**: [https://logto.io/privacy](https://logto.io/privacy)
- **Hosting**: Self-hosted on our VPS (Hostinger KVM2, EU datacenter). Data does not leave our infrastructure during normal operation. Logto's own telemetry/update pings may occur to Logto's servers — see their privacy policy.

### 4.2 Cloudflare

Cloudflare acts as our DNS provider, CDN, and DDoS protection layer, and provides R2 object storage for game content (video frame images, clips, audio, and OG share images).

| Cloudflare Product | Data Accessed | Notes |
|-------------------|--------------|-------|
| CDN / DNS Proxy | All HTTP requests pass through Cloudflare's network before reaching our VPS. Cloudflare sees IP addresses, request headers, and response metadata. | Cloudflare's standard data processing applies. We do not control Cloudflare's logging of transit traffic. |
| R2 Object Storage | Frame images, clips, audio files, OG share images. No personal data is stored in R2. | Content is served via signed URLs with 1-hour TTLs. |

- **Privacy policy**: [https://www.cloudflare.com/privacypolicy/](https://www.cloudflare.com/privacypolicy/)
- **GDPR DPA**: Cloudflare offers a Data Processing Addendum. [To be executed before launch.]

### 4.3 GitHub

- **Role**: Source code hosting and CI/CD pipeline execution (GitHub Actions).
- **Data shared**: No user personal data is sent to GitHub. GitHub Actions runs the daily content pipeline (yt-dlp + ffmpeg + R2 upload) and CI test suite. Pipeline logs are retained by GitHub for 90 days.
- **Privacy policy**: [https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)

### 4.4 SSO Identity Providers (User-Initiated)

When you choose to register with a social provider, that provider shares a subset of your profile with us at the moment of authentication. We receive only what you authorise.

| Provider | Data Received | Scope Requested |
|----------|--------------|----------------|
| Google | Name, email, profile picture | `profile email` |
| Discord | Username, email, avatar | `identify email` |
| Apple | Name (optional), email or relay address | `name email` |
| GitHub | Username, email (if public) | `read:user user:email` |
| X (Twitter) | Username, display name, avatar | `tweet.read users.read` |

We do not receive passwords, follower counts, private messages, or any content from these providers.

---

## 5. Cookies and Local Storage

| Storage Mechanism | Key | Purpose | Duration |
|-------------------|-----|---------|----------|
| `localStorage` | `framedle_anon_id` | Anonymous identity fingerprint hash | Persistent until cleared by user |
| `localStorage` | `framedle_prefs` | UI preferences (theme, sound settings) | Persistent until cleared by user |
| HTTP Cookie (Logto session) | `logto_session` | Authentication session for registered users | Session or 30 days (if "remember me" selected) |

We do not use third-party tracking cookies. We do not use advertising cookies.

**Note on device fingerprinting**: The fingerprint described in Section 2.1 is generated from browser/device signals at the JavaScript layer. It is not a cookie. It is stored as a hash in `localStorage` and on our server. It functions similarly to a cookie for the purpose of GDPR's definition of "information stored on or accessed from a terminal device" under the ePrivacy Directive. We disclose its use here.

---

## 6. Your Rights (GDPR)

If you are located in the European Economic Area, the United Kingdom, or Switzerland, you have the following rights under the General Data Protection Regulation (GDPR):

| Right | Description | How to Exercise |
|-------|-------------|----------------|
| **Access** | Request a copy of all personal data we hold about you | Email privacy@framedle.wtf with subject "Data Access Request" |
| **Rectification** | Correct inaccurate data (e.g., display name) | Update directly in your profile settings, or contact us |
| **Erasure ("right to be forgotten")** | Delete your account and associated game results | Delete account in settings (registered users), or email us for anonymous fingerprint deletion |
| **Portability** | Receive your game history in a machine-readable format (JSON) | Email privacy@framedle.wtf with subject "Data Portability Request" |
| **Restriction** | Ask us to restrict processing while a dispute is resolved | Contact us |
| **Objection** | Object to processing based on legitimate interest | Contact us |
| **Withdraw consent** | Withdraw consent for optional processing (e.g., marketing emails) | Unsubscribe link in emails, or email us |

**Anonymous fingerprint deletion**: If you played anonymously and want your device fingerprint and associated game results deleted, email us with "Anonymous Data Deletion" in the subject line. We will delete the hashed fingerprint and all linked game results within 30 days.

We will respond to all requests within 30 days. We will not charge a fee for reasonable requests.

---

## 7. Data Retention

| Data | Retention Period | Rationale |
|------|-----------------|-----------|
| Game results (registered) | Indefinite while account is active; deleted 90 days after account deletion | Enables lifetime statistics and achievements |
| Game results (anonymous, fingerprint-linked) | Indefinite; deletable on request (see Section 6) | Enables streak continuity and history merge on registration |
| Device fingerprint hash | Indefinite while anonymous identity is active; deleted on request or upon account merge | Required for daily limit enforcement |
| Logto authentication records | Per Logto's data retention policy | Identity management |
| API request logs | 30 days | Security review; then automatically purged |
| Valkey (cache/lock) keys | Short-lived; daily lock keys expire at UTC midnight | Operational only |

---

## 8. Data Security

- All data in transit is encrypted via HTTPS (TLS 1.2+), enforced by Cloudflare.
- PostgreSQL and Valkey are not exposed to the public internet; accessible only within the VPS private network.
- Device fingerprints are stored as SHA-256 hashes with a server-side salt. Raw signals are never persisted.
- Frame content URLs use signed short-lived URLs (1-hour TTL) to prevent hotlinking.
- The API uses HMAC-signed game session tokens to prevent replay attacks.
- Access to the production database is restricted to VPS-local connections and authorised personnel.

---

## 9. Children's Privacy

Framedle is not directed at children under 13 (or under 16 in the EU). We do not knowingly collect personal data from children. If you believe a child has submitted personal data to us, contact us and we will delete it promptly.

---

## 10. Changes to This Policy

We will post any material changes to this policy on this page and update the "Last updated" date. Significant changes will be communicated via an in-app notice. Continued use of Framedle after a change constitutes acceptance of the revised policy.

---

## 11. Contact

For privacy-related questions, data requests, or to exercise your rights:

- **Email**: privacy@framedle.wtf [to be set up before launch]
- **Postal**: [Legal entity address — to be confirmed]

For Cloudflare data processing inquiries, contact Cloudflare directly at their privacy address listed in their policy.

---

> **DRAFT — Pending Legal Review**
>
> This document was prepared by the Framedle engineering team as a skeleton to map data flows ahead of launch. It has not been reviewed by legal counsel. Before publishing this policy to users, the following must occur:
>
> 1. Review by a lawyer qualified in GDPR and ePrivacy compliance.
> 2. Confirmation of the legal entity name, registered address, and DPO designation (if required).
> 3. Execution of a Data Processing Addendum with Cloudflare.
> 4. Verification that the fingerprinting disclosure satisfies the ePrivacy Directive requirements in each target jurisdiction.
> 5. Review of SSO provider scopes against actual implementation.
> 6. Confirmation of the data retention periods against operational requirements.
>
> Do not use this document as legal advice.
