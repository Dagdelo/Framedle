# Game Modes — Detailed Design

## Design Philosophy

1. **Instant Comprehension** — understand the mode in under 5 seconds
2. **Quick Sessions** — no mode takes longer than 3 minutes
3. **Share-worthy Results** — every mode produces a shareable emoji grid

---

## 🖼️ Mode 1: Daily Frame (Flagship)

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

### Input: Search-as-you-type against a video title database (server-side fuzzy search).

### Scoring: 1st guess = 1000, 2nd = 800, 3rd = 600, 4th = 400, 5th = 200, 6th = 100, fail = 0

### Share: `🎬 Framedle #142 — 3/6 🟨🟨🟩⬛⬛⬛ 🔥12 ⏱️0:47`

---

## 🎬 Mode 2: Clip Guesser

> *2-3 second silent clip from peak heatmap moment. Name that video.*

- Unlimited replays. **3 guesses** only.
- Wrong guess: clip extends +1 second each time.
- Score: 1st = 500, 2nd = 300, 3rd = 100

---

## 📺 Mode 3: Channel Check

> *Five frames from five videos. All one channel. Name the YouTuber.*

- Frames revealed one at a time. **4 guesses**.
- Wrong guess reveals subscriber count range.
- Weekly difficulty rotation: Easy (10M+), Medium (1M-10M), Hard (100K-1M)
- Score by frames needed: 1 frame = 800, 2 = 600, 3 = 400, 4 = 200, 5 = 100

---

## 📅 Mode 4: Year Guesser

> *Full-color frame. Guess the upload year.*

- Timeline slider 2005→current. 5 rounds per game.
- Per-round: exact = 200, ±1yr = 150, ±2yr = 100, ±3yr = 50, ±4+ = 10
- Max score: 1000

---

## 🔢 Mode 5: View Count Blitz

> *Thumbnail + title. How viral is this?*

- Select range: <100K / 100K-1M / 1M-10M / 10M-100M / 100M+ / 1B+
- 8 rounds, 15s each. Speed bonus: <5s = +50, <10s = +25

---

## ⏱️ Mode 6: Timeline Sort

> *5 frames from one video. Put them in chronological order.*

- Drag-and-drop. One attempt. Score by correct positions.
- 5/5 = 500, 4/5 = 350, 3/5 = 200, 2/5 = 100, 1/5 = 25

---

## 🔍 Mode 7: Pixel Reveal

> *Start at 8×8 pixels. Reveal progressively. Fewer reveals = more points.*

- Levels: 8×8 → 16 → 32 → 64 → 128 → Full
- Points: 1000 → 750 → 500 → 300 → 150 → 50
- Wrong guess: -100 per attempt (max 3 wrong)

---

## 🏷️ Mode 8: Category Clash

> *Quick-fire categorization. 10 seconds per round.*

- Categories: Gaming, Music, Education, Vlogs, Sports, Comedy, News, Tech, Food, Travel
- 12 rounds. Correct = 100pts. Speed bonus (<3s) = +50

---

## 🔥 Mode 9: Streak Mode

> *Endless. Multiple choice (4 options). How many in a row?*

- Correct → next. Wrong → game over.
- Difficulty climbs every 5 rounds (options become more similar).
- Multiplier: ×1.0 (1-5), ×1.5 (6-10), ×2.0 (11-20), ×3.0 (21+)

---

## ⚔️ Mode 10: Duels (Multiplayer)

> *Same frame. Two players. Fastest correct guess wins.*

- Matchmaking queue or friend invite link
- Best of 5 rounds. 30s timer each.
- Server timestamps both guesses — no latency advantage
- Win round = 200pts. Match bonuses: 3-0 sweep = +300, 3-1 = +150

---

## 🧩 Mode 11: Fragment Match

> *4 cropped pieces. 4 full frames. Match them up.*

- Drag to connect. One attempt. 60 seconds.
- 4/4 = 400, 3/4 = 250, 2/4 = 100, 1/4 = 25

---

## 🎵 Mode 12: Sound Only (Phase 3)

> *Audio only from peak heatmap moment. No visuals.*

- 5-second clip. 3 guesses. Wrong → extend to 8s, then 12s.
- Score: 1st = 500, 2nd = 300, 3rd = 100
- Requires additional pipeline step (audio extraction to .opus)

---

## Daily Calendar

| Slot | Mode | Rotation |
|------|------|----------|
| 1 | Daily Frame | Always |
| 2 | Clip Guesser / Channel Check / Year Guesser | Rotating |
| 3 | Category Clash | Always |
| 4 | Pixel Reveal / Timeline Sort | Alternating |

## Difficulty Calibration

Score 1-10 per video based on: subscriber count, view count, category familiarity, recency, title memorability. Daily = 5-6 difficulty. Streak starts at 3, climbs to 9+.
