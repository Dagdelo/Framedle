# Scoring, Progression & Social Systems

## FScore — Unified Scoring System

Every game mode produces a raw score. The **FScore** normalizes scores across modes for fair leaderboard comparison:

```
FScore = base_score × streak_multiplier × mode_weight
```

| Component | Range | Description |
|-----------|-------|-------------|
| `base_score` | 0-1000 | Raw score from the game mode |
| `streak_multiplier` | 1.0-1.6 | Bonus for consecutive daily plays |
| `mode_weight` | 0.8-1.2 | Normalizes difficulty across modes |

### Mode Weights

| Mode | Weight | Rationale |
|------|--------|-----------|
| Daily Frame | 1.0 | Baseline |
| Clip Guesser | 1.0 | Similar difficulty |
| Channel Check | 1.1 | Requires deeper knowledge |
| Year Guesser | 0.9 | Easier with visual cues |
| View Count Blitz | 0.8 | Some guessing involved |
| Timeline Sort | 1.0 | Balanced |
| Pixel Reveal | 1.2 | Very hard at low pixels |
| Category Clash | 0.8 | Most accessible mode |
| Streak Mode | 1.0 | Self-scaling difficulty |
| Duels | 1.1 | Competitive pressure |
| Fragment Match | 0.9 | Pattern matching |
| Sound Only | 1.2 | No visual cues |

---

## XP & Leveling

XP is earned from game completions. FScore is converted to XP at a 1:1 ratio, with bonuses for achievements and streaks.

| Level Range | XP Required | Title | Badge |
|-------------|------------|-------|-------|
| 1-5 | 0 - 2,500 | Viewer | 📺 |
| 6-10 | 2,500 - 10,000 | Cinephile | 🎬 |
| 11-20 | 10,000 - 50,000 | Frame Hunter | 🎯 |
| 21-35 | 50,000 - 150,000 | Binge Watcher | 🔥 |
| 36-50 | 150,000 - 500,000 | Algorithm Whisperer | 🏆 |
| 51-75 | 500,000 - 1,500,000 | YouTube Historian | 💎 |
| 76-100 | 1,500,000 - 5,000,000 | Framedle Legend | 👑 |

### XP Formula

```
xp_earned = fscore + achievement_bonus + streak_bonus + first_play_bonus
```

- `achievement_bonus`: XP from any achievements unlocked during the game
- `streak_bonus`: +50 XP per active streak day (e.g., 7-day streak = +350 per game)
- `first_play_bonus`: +100 XP for first time playing a new mode

### Level-Up Curve

The XP requirement follows a quadratic curve to create satisfying early progression while requiring dedication at higher levels:

```
xp_for_level(n) = 50 × n²
```

| Level | Total XP | Games at avg 400 FScore |
|-------|----------|------------------------|
| 5 | 1,250 | ~3 games |
| 10 | 5,000 | ~13 games |
| 25 | 31,250 | ~78 games |
| 50 | 125,000 | ~313 games |
| 75 | 281,250 | ~703 games |
| 100 | 500,000 | ~1,250 games |

---

## Streak System

Playing at least one daily mode maintains the streak. Missing a day breaks it (unless a freeze is used).

### Streak Tiers

| Days | Tier | Visual | Bonus |
|------|------|--------|-------|
| 1-6 | None | No indicator | — |
| 7-29 | Bronze | 🔥 | +500 XP on reaching 7 |
| 30-99 | Silver | 🔥🔥 | +2,000 XP on reaching 30 |
| 100-364 | Gold | 🔥🔥🔥 | +5,000 XP on reaching 100 |
| 365+ | Diamond | 💎🔥 | +10,000 XP on reaching 365 |

### Streak Multiplier (applied to FScore)

| Streak Days | Multiplier |
|-------------|-----------|
| 0-6 | 1.0× |
| 7-13 | 1.1× |
| 14-29 | 1.2× |
| 30-59 | 1.3× |
| 60-99 | 1.4× |
| 100-199 | 1.5× |
| 200+ | 1.6× (max) |

### Streak Freeze

- **Earning**: one freeze granted per 7-day streak milestone
- **Storage**: max 2 freezes held at once
- **Usage**: automatically consumed if a day is missed
- **Visibility**: freeze count shown on profile and game hub
- **Registered users only**: anonymous users cannot accumulate freezes

---

## Achievements

### General

| Achievement | Condition | Reward | Rarity |
|------------|-----------|--------|--------|
| 🎯 First Blood | Complete any game mode | 100 XP | Common |
| 🏆 Completionist | Play all 12 modes at least once | Badge | Uncommon |
| 📺 Binge | Complete 10 games in one day | 200 XP | Uncommon |
| 🌍 World Tour | ID videos from 20+ countries | Badge | Rare |
| 📈 Level 50 | Reach level 50 | Badge | Epic |
| 👑 Level 100 | Reach level 100 | Badge + Title | Legendary |

### Mode-Specific

| Achievement | Condition | Reward | Rarity |
|------------|-----------|--------|--------|
| 🧠 Genius | Daily Frame correct on guess 1 | 500 XP | Rare |
| 👁️ Eagle Eye | Pixel Reveal correct at 8×8 level | 1,000 XP | Epic |
| 📚 Scholar | 5 perfect Year Guesser games (1000/1000) | Badge | Rare |
| 🎵 Perfect Pitch | Sound Only correct on first listen | 300 XP | Rare |
| ⚡ Speed Demon | Win a Duel in under 5 seconds total | 300 XP | Epic |
| 🧩 Puzzle Master | Fragment Match 4/4 in under 15 seconds | Badge | Rare |
| 🏷️ Categorizer | 12/12 in Category Clash | Badge | Uncommon |
| 🔥 Unstoppable | 50+ streak in Streak Mode | Badge | Epic |

### Streak

| Achievement | Condition | Reward | Rarity |
|------------|-----------|--------|--------|
| 🔥 On Fire | 7-day streak | Badge | Common |
| 🔥🔥 Dedicated | 30-day streak | Badge | Uncommon |
| 🔥🔥🔥 Committed | 100-day streak | Badge | Rare |
| 💎🔥 Eternal | 365-day streak | Badge + Title | Legendary |

### Social

| Achievement | Condition | Reward | Rarity |
|------------|-----------|--------|--------|
| 👑 #1 | Reach #1 on any daily leaderboard | Badge + 1,000 XP | Epic |
| ⚔️ Gladiator | Win 100 Duels | Badge | Rare |
| 🤝 Social Butterfly | Share results 50 times | Badge | Uncommon |
| 👥 Rival | Duel the same person 10 times | Badge | Uncommon |

### Progress Tracking

Achievements with numeric conditions show progress (e.g., "Gladiator: 47/100 Duel wins"). Progress is stored in `user_achievements.progress` JSONB field.

---

## Leaderboards

### Types

| Leaderboard | Period | Reset | Key |
|-------------|--------|-------|-----|
| Daily | Per day, per mode | Midnight UTC | `lb:{mode}:{date}` |
| Weekly | Monday-Sunday aggregate | Sunday midnight UTC | `lb:{mode}:week:{iso_week}` |
| All-Time | Cumulative | Never | `lb:alltime` |
| Friends | Filtered to social connections | Varies | Client-side filter |
| Country | Filtered by user.country_code | Varies | `lb:{mode}:{date}:country:{cc}` |

### Implementation (Valkey)

```
# Add score
ZADD lb:daily-frame:2025-02-22 1000 "user_abc"

# Get rank (0-indexed)
ZREVRANK lb:daily-frame:2025-02-22 "user_abc"

# Top 100
ZREVRANGE lb:daily-frame:2025-02-22 0 99 WITHSCORES

# Surrounding players (for "your rank" view)
ZREVRANK lb:daily-frame:2025-02-22 "user_abc"  → rank N
ZREVRANGE lb:daily-frame:2025-02-22 (N-5) (N+5) WITHSCORES
```

### Weekly Aggregation

A scheduled cron job on the VPS runs Sunday midnight UTC:

1. Reads all daily leaderboards for the week
2. Aggregates scores per user (sum of best daily FScores)
3. Writes to `lb:{mode}:week:{iso_week}` sorted set
4. Snapshots top 100 to `leaderboard_snapshots` table (PostgreSQL) for historical records

### Leaderboard UI

- **Tabs**: Daily | Weekly | All-Time | Friends | Country
- **User row**: always highlighted, even if scrolled off-screen (pinned row at bottom)
- **Pagination**: infinite scroll, load 50 at a time
- **Data shown**: Rank, Avatar, Display Name, Score, Level Badge, Country Flag
- **Pull-to-refresh**: mobile support

---

## Social Sharing

### Dynamic OG Image

Generated per game result via Cloudflare Worker (Satori/Resvg):

```
┌──────────────────────────────┐
│  🎬 FRAMEDLE #142            │
│  [Blurred frame background]  │
│  Score: 3/6  ⏱️ 0:47        │
│  🟨🟨🟩⬛⬛⬛                  │
│  🔥 12-day streak            │
│  Lv.23 🎯 Frame Hunter      │
│  framedle.wtf                 │
└──────────────────────────────┘
```

- Cached in R2 under `og/{share_hash}.png`
- Generated lazily on first share link access
- TTL: 7 days (immutable content, long cache)

### Share Text Templates

**Daily Frame**:
```
🎬 Framedle #142 — 3/6
🟨🟨🟩⬛⬛⬛
🔥12 ⏱️0:47
framedle.wtf
```

**Year Guesser**:
```
📅 Framedle Year #142 — 750/1000
🟩🟩🟨🟩🟨 (✓ ✓ ±1 ✓ ±2)
framedle.wtf
```

**Streak Mode**:
```
🔥 Framedle Streak — 23 🎯
⚡ Best: 23 | 🏆 Top 2%
framedle.wtf
```

**Duels**:
```
⚔️ Framedle Duel
🏆 W 3-1
⚡ Avg: 4.2s
framedle.wtf
```

**Pixel Reveal**:
```
🔍 Framedle Pixel #142 — 750pts
🟫🟩⬛⬛⬛⬛
Guessed at 16×16!
framedle.wtf
```

### Share Destinations

| Platform | Method | Content |
|----------|--------|---------|
| Clipboard | Copy button | Text + emoji grid |
| Twitter/X | Intent URL | Pre-formatted text + OG image via link |
| WhatsApp | Share URL | Link preview (OG tags) |
| Telegram | Share URL | Link preview (OG tags) |
| Instagram Stories | Image export | Full-size share card (PNG) |
| Discord | Paste | Text + link preview |
| Native share | Web Share API / Tauri plugin | Text + optional image |

### Deep Links

Share URLs follow the format: `framedle.wtf/share/{share_hash}`

The share page:
1. Renders SSR meta tags (OG image, title, description) for link previews
2. Shows the game result (blurred frame, score grid, streak)
3. CTA button: "Play today's Framedle" → redirects to game hub
4. Does NOT reveal the answer (anti-spoiler)

---

## Anonymous vs Registered Players

| Feature | Anonymous | Registered |
|---------|-----------|------------|
| Play daily modes | ✅ | ✅ |
| Score tracking | Local only | Server-synced |
| Leaderboards | View only | Participate |
| Streaks | Local tracking | Server-synced + freezes |
| Achievements | Not tracked | Full tracking |
| Duels | ❌ | ✅ |
| Friends leaderboard | ❌ | ✅ |
| Share results | ✅ (text only) | ✅ (text + OG image + deep link) |
| Profile page | ❌ | ✅ |

### Account Upgrade Flow

1. Anonymous user plays games → results stored locally (IndexedDB/SQLite) + server-side keyed by device fingerprint
2. User registers via Logto (Google, Discord, Apple, etc.)
3. Prompted: "Claim your anonymous history?"
4. `POST /api/user/claim-anonymous { fingerprint }` merges all anonymous results to the new account
5. One-way merge — anonymous identity is retired
