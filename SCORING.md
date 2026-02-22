# Scoring, Progression & Social Systems

## XP & Leveling

| Level Range | XP Required | Title |
|-------------|------------|-------|
| 1-5 | 0 - 2,500 | 📺 Viewer |
| 6-10 | 2,500 - 10,000 | 🎬 Cinephile |
| 11-20 | 10,000 - 50,000 | 🎯 Frame Hunter |
| 21-35 | 50,000 - 150,000 | 🔥 Binge Watcher |
| 36-50 | 150,000 - 500,000 | 🏆 Algorithm Whisperer |
| 51-75 | 500,000 - 1,500,000 | 💎 YouTube Historian |
| 76-100 | 1,500,000 - 5,000,000 | 👑 Framedle Legend |

## Streak System

- **7-day**: 🔥 Bronze flame + streak counter
- **30-day**: 🔥🔥 Silver flame + 500 bonus XP
- **100-day**: 🔥🔥🔥 Gold flame + 2000 bonus XP
- **365-day**: 💎🔥 Diamond flame + 10000 bonus XP

**Streak Freeze**: earned weekly, max 2 stored. Protects one missed day.

## Achievements

| Achievement | Condition | Reward |
|------------|-----------|--------|
| 🎯 First Blood | Complete any game mode | 100 XP |
| 🧠 Genius | Daily Frame on attempt 1 | 500 XP |
| 🔥 On Fire | 7-day streak | Badge |
| ⚡ Speed Demon | Win a Duel in under 5s total | 300 XP |
| 👁️ Eagle Eye | Pixel Reveal at 8×8 level | 1000 XP |
| 🏆 Completionist | Play all 12 modes once | Badge |
| 🌍 World Tour | ID videos from 20+ countries | Badge |
| 👑 #1 | Reach #1 on any daily leaderboard | Badge + 1000 XP |
| ⚔️ Gladiator | Win 100 Duels | Badge |

## Leaderboards

### Types
1. **Daily** — resets at midnight UTC, per mode
2. **Weekly** — Monday to Sunday aggregate
3. **All-Time** — cumulative XP
4. **Friends** — filtered to Clerk social connections
5. **Country** — user's selected country flag

### Implementation (Upstash Redis)
```
ZADD leaderboard:daily-frame:2025-02-22 1000 "user_abc"
ZREVRANK leaderboard:daily-frame:2025-02-22 "user_abc"    → rank
ZREVRANGE leaderboard:daily-frame:2025-02-22 0 99 WITHSCORES → top 100
```

## Social Sharing

### Dynamic OG Image (per game result)
Generated via Cloudflare Worker (Satori/Resvg):
```
┌──────────────────────────────┐
│  🎬 FRAMEDLE #142            │
│  [Blurred frame]             │
│  Score: 3/6  ⏱️ 0:47        │
│  🟨🟨🟩⬛⬛⬛                  │
│  🔥 12-day streak            │
│  framedle.gg                 │
└──────────────────────────────┘
```

### Share Text Templates

**Daily Frame**: `🎬 Framedle #142 — 3/6\n🟨🟨🟩⬛⬛⬛\n🔥12 ⏱️0:47`
**Year Guesser**: `📅 Framedle Year #142 — 750/1000\n🟩🟩🟨🟩🟨 (✓ ✓ ±1 ✓ ±2)`
**Streak**: `🔥 Framedle Streak — 23 🎯\n⚡ Best: 23 | 🏆 Top 2%`
**Duels**: `⚔️ Framedle Duel\n🏆 W 3-1\n⚡ Avg: 4.2s`

### Destinations
- Clipboard (text + emoji)
- Twitter/X (pre-formatted + OG image)
- WhatsApp / Telegram (link preview)
- Instagram Stories (image export)
- Native share sheet (mobile/desktop)
