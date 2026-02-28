# Game Modes — Detailed Design

## Design Philosophy

1. **Instant Comprehension** — understand the mode in under 5 seconds
2. **Quick Sessions** — no mode takes longer than 3 minutes
3. **Share-worthy Results** — every mode produces a shareable emoji grid
4. **Progressive Mastery** — skill improves over time; deeper YouTube knowledge is rewarded
5. **Variety** — visual, audio, temporal, and knowledge-based challenges

---

## Mode 1: Daily Frame (Flagship)

> *The Wordle of YouTube. One video per day. Six guesses. Everyone plays the same puzzle.*

### Reveal Progression

| Guess # | Frame Shown | Hint Given |
|---------|------------|------------|
| 1 | Tight crop (25%), desaturated | None |
| 2 | Medium crop (50%), desaturated | Video category |
| 3 | Full frame, desaturated | Channel name (blurred) |
| 4 | Full frame, color | Channel name (clear) |
| 5 | Second heatmap frame, color | Upload year |
| 6 | Third frame + view count hint | View count range |

### Input

Search-as-you-type against a video title database (server-side fuzzy search via `pg_trgm`). Top 10 results shown with title, channel, and thumbnail.

### Scoring

| Guess | Points |
|-------|--------|
| 1st | 1000 |
| 2nd | 800 |
| 3rd | 600 |
| 4th | 400 |
| 5th | 200 |
| 6th | 100 |
| Failed | 0 |

### Share Format

```
🎬 Framedle #142 — 3/6
🟨🟨🟩⬛⬛⬛
🔥12 ⏱️0:47
framedle.wtf
```

### Anti-Cheat

- Frame URLs use obfuscated UUIDs (no video ID in path)
- Signed R2 URLs with 1-hour TTL
- HMAC session hash required with each guess
- Timing validation: correct answer <500ms after frame load is flagged

---

## Mode 2: Clip Guesser

> *2-3 second silent clip from peak heatmap moment. Name that video.*

- **Guesses**: 3 total
- **Replays**: unlimited
- **Wrong guess**: clip extends +1 second each time (2s → 3s → 4s)
- **Score**: 1st = 500, 2nd = 300, 3rd = 100
- **Pipeline**: requires 5-second MP4 clip extraction at heatmap peaks
- **Phase**: 3 (requires clip extraction pipeline)

### Share Format

```
🎬 Framedle Clip #142 — 1/3
🟩⬛⬛
⏱️ 2s clip
```

---

## Mode 3: Channel Check

> *Five frames from five videos. All one channel. Name the YouTuber.*

- **Frames**: revealed one at a time
- **Guesses**: 4 total
- **Wrong guess**: reveals subscriber count range
- **Difficulty rotation**: Easy (10M+), Medium (1M-10M), Hard (100K-1M) — weekly cycle

| Frames Needed | Points |
|---------------|--------|
| 1 | 800 |
| 2 | 600 |
| 3 | 400 |
| 4 | 200 |
| 5 (+ all wrong) | 0 |

### Pipeline Requirement

Videos must be grouped by channel in the database. Channel Check requires at least 5 processed videos per featured channel.

### Share Format

```
📺 Framedle Channel #42 — 2/4
🟨🟩⬛⬛
🖼️ 3 frames needed
```

---

## Mode 4: Year Guesser

> *Full-color frame. Guess the upload year.*

- **Input**: Timeline slider (2005 → current year)
- **Rounds**: 5 per game
- **Max score**: 1000

| Accuracy | Points Per Round |
|----------|-----------------|
| Exact year | 200 |
| ±1 year | 150 |
| ±2 years | 100 |
| ±3 years | 50 |
| ±4+ years | 10 |

### Design Notes

Visual cues that help: video resolution/quality, UI elements visible in frame, fashion trends, popular games/memes of the era. This mode rewards knowledge of YouTube's visual evolution.

### Share Format

```
📅 Framedle Year #142 — 750/1000
🟩🟩🟨🟩🟨
(✓ ✓ ±1 ✓ ±2)
```

---

## Mode 5: View Count Blitz

> *Thumbnail + title. How viral is this?*

- **Display**: video thumbnail + title (no channel name)
- **Input**: select from 6 ranges: <100K / 100K-1M / 1M-10M / 10M-100M / 100M+ / 1B+
- **Rounds**: 8 total
- **Timer**: 15 seconds per round
- **Speed bonus**: <5s = +50, <10s = +25
- **Correct answer**: 100 points base

### Difficulty Calibration

Videos are selected to span all view count ranges. Adjacent-range answers (e.g., selecting 1M-10M when actual is 10M-100M) receive half points (50).

### Share Format

```
🔢 Framedle Views #42 — 650/800
🟩🟩🟨🟩🟩🟨🟩🟩
⚡ 3 speed bonuses
```

---

## Mode 6: Timeline Sort

> *5 frames from one video. Put them in chronological order.*

- **Input**: drag-and-drop sortable list
- **Attempts**: one only
- **Timer**: 60 seconds

| Correct Positions | Points |
|-------------------|--------|
| 5/5 | 500 |
| 4/5 | 350 |
| 3/5 | 200 |
| 2/5 | 100 |
| 1/5 | 25 |
| 0/5 | 0 |

### Design Notes

Frames are selected from distinct moments in the video (intro, buildup, climax, resolution, outro). Contextual clues include lighting changes, outfit changes, location shifts.

### Share Format

```
⏱️ Framedle Timeline #42 — 4/5
🔢 4 correct positions
⏱️ 0:23
```

---

## Mode 7: Pixel Reveal

> *Start at 8x8 pixels. Reveal progressively. Fewer reveals = more points.*

| Level | Resolution | Points if Guessed |
|-------|-----------|-------------------|
| 1 | 8x8 | 1000 |
| 2 | 16x16 | 750 |
| 3 | 32x32 | 500 |
| 4 | 64x64 | 300 |
| 5 | 128x128 | 150 |
| 6 | Full | 50 |

- **Wrong guesses**: -100 per attempt (max 3 wrong before auto-advance)
- **Controls**: "Reveal more" button or guess input

### Pipeline Requirement

Pre-generate pixelated variants at all 5 levels for each frame. Uses nearest-neighbor downscale then upscale to maintain blocky aesthetic.

### Share Format

```
🔍 Framedle Pixel #142 — 750pts
🟫🟩⬛⬛⬛⬛
Guessed at 16×16!
```

---

## Mode 8: Category Clash

> *Quick-fire categorization. 10 seconds per round.*

- **Categories**: Gaming, Music, Education, Vlogs, Sports, Comedy, News, Tech, Food, Travel
- **Rounds**: 12
- **Base score**: 100 per correct answer
- **Speed bonus**: <3s answer = +50 points
- **Time penalty**: no answer in 10s = 0 points, skip to next

### Design Notes

This is the most accessible mode — no YouTube-specific knowledge required. The frame itself usually contains enough visual context to categorize correctly. Good entry point for new players.

### Share Format

```
🏷️ Framedle Categories #42 — 1050/1200
🟩🟩🟩🟨🟩🟩🟩🟩🟨🟩🟩🟩
⚡ 5 speed bonuses
```

---

## Mode 9: Streak Mode

> *Endless. Multiple choice (4 options). How many in a row?*

- **Format**: frame shown + 4 video title options (multiple choice)
- **Flow**: correct → next round; wrong → game over
- **Difficulty scaling**: every 5 rounds, options become more similar (same category, similar view counts)

| Rounds | Multiplier |
|--------|-----------|
| 1-5 | ×1.0 |
| 6-10 | ×1.5 |
| 11-20 | ×2.0 |
| 21+ | ×3.0 |

### Design Notes

The distractor options (wrong answers) are selected from the same category and similar era as the correct answer, making higher streaks increasingly challenging. At round 20+, distractors may be from the same channel.

### Share Format

```
🔥 Framedle Streak — 23
⚡ Best: 23 | 🏆 Top 2%
```

---

## Mode 10: Duels (Multiplayer)

> *Same frame. Two players. Fastest correct guess wins.*

- **Matchmaking**: queue or friend invite link
- **Format**: best of 5 rounds
- **Timer**: 30 seconds per round
- **Server timestamps**: both guesses compared by server time (no latency advantage)
- **Input**: search-as-you-type (same as Daily Frame)

| Result | Points |
|--------|--------|
| Win round | 200 |
| 3-0 sweep bonus | +300 |
| 3-1 bonus | +150 |
| 3-2 bonus | +50 |

### Real-time Infrastructure

Each match is a Cloudflare Durable Object with WebSocket connections. The DO holds match state, distributes frames simultaneously, validates guesses, and manages round transitions — all in a single-threaded, strongly consistent context.

### Share Format

```
⚔️ Framedle Duel
🏆 W 3-1 vs @opponent
⚡ Avg: 4.2s
```

---

## Mode 11: Fragment Match

> *4 cropped pieces. 4 full frames. Match them up.*

- **Input**: drag to connect fragment → frame
- **Attempts**: one
- **Timer**: 60 seconds

| Correct Matches | Points |
|-----------------|--------|
| 4/4 | 400 |
| 3/4 | 250 |
| 2/4 | 100 |
| 1/4 | 25 |
| 0/4 | 0 |

### Pipeline Requirement

Pre-generate quadrant crops (top-left, top-right, bottom-left, bottom-right) for each frame.

### Share Format

```
🧩 Framedle Fragments #42 — 4/4
🟩🟩🟩🟩
⏱️ 0:18
```

---

## Mode 12: Sound Only

> *Audio only from peak heatmap moment. No visuals.*

- **Clip**: 5 seconds of audio
- **Guesses**: 3
- **Wrong guess**: clip extends to 8s, then 12s
- **Score**: 1st = 500, 2nd = 300, 3rd = 100
- **Phase**: 4 (requires audio extraction pipeline step → .opus format)

### Design Notes

Works best with music videos, iconic sound effects, recognizable voices, or meme sounds. The pipeline extracts audio at heatmap peaks and converts to Opus format for efficient streaming.

### Share Format

```
🎵 Framedle Sound #42 — 1/3
🟩⬛⬛
🔊 Guessed in 5s clip!
```

---

## Daily Calendar

Each day offers multiple modes, ensuring variety and replayability:

| Slot | Mode | Rotation |
|------|------|----------|
| 1 (always) | Daily Frame | Fixed — available every day |
| 2 (rotating) | Clip Guesser / Channel Check / Year Guesser | 3-day cycle |
| 3 (always) | Category Clash | Fixed — accessible entry point |
| 4 (alternating) | Pixel Reveal / Timeline Sort | Alternating days |

Additional modes (Streak, Duels) are available on-demand, not daily-locked.

---

## Difficulty Calibration

Each video receives a difficulty score (1-10) computed from weighted factors:

| Factor | Weight | Low Difficulty (1-3) | High Difficulty (8-10) |
|--------|--------|---------------------|----------------------|
| Subscriber count | 25% | >10M subs | <100K subs |
| View count | 25% | >100M views | <1M views |
| Category familiarity | 15% | Gaming, Music | Education, News |
| Recency | 15% | Last 2 years | 5+ years ago |
| Title memorability | 10% | Iconic/meme titles | Generic titles |
| Visual distinctiveness | 10% | Unique visuals | Generic talking head |

```
difficulty = round(
  sub_score * 0.25 +
  view_score * 0.25 +
  category_score * 0.15 +
  recency_score * 0.15 +
  title_score * 0.10 +
  visual_score * 0.10
)
```

### Mode-Specific Difficulty Targets

| Mode | Target Difficulty | Rationale |
|------|-------------------|-----------|
| Daily Frame | 5-6 | Challenging but fair for daily play |
| Channel Check (Easy week) | 2-3 | Mega-popular creators |
| Channel Check (Hard week) | 7-8 | Niche but recognizable |
| Streak (start) | 3 | Easy entry |
| Streak (round 20+) | 9-10 | Very hard to maintain |
| Duels | 4-6 | Balanced for competitive play |

---

## Seasonal Events

Special themed weeks/weekends with curated video sets:

| Event | Timing | Description |
|-------|--------|-------------|
| YouTube Rewind | December | Iconic moments from the year |
| Creator Spotlight | Monthly | One featured channel all week |
| Throwback Week | Quarterly | Only pre-2015 videos |
| Genre Week | Bi-monthly | Gaming Week, Music Week, etc. |
| Holiday Specials | Major holidays | Themed content (Halloween, etc.) |

Seasonal events grant exclusive badges and double XP.
