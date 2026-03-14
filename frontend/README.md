# capALT — Frontend

> Passive human verification. No CAPTCHAs. No friction. Pure behavioral ML.

capALT replaces traditional CAPTCHA challenges with a passive behavioral analysis system. It silently collects mouse movements, keystroke patterns, scroll behavior, and session timing — then sends them to an ML backend that scores the likelihood of human interaction in real time.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Dev server and bundler |
| TailwindCSS | Styling |

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── BehaviorTracker.ts   # DOM event listener class
│   │   ├── LoginPage.tsx        # Main UI — login form + analytics panel
│   │   └── ResultCard.tsx       # Verification result display
│   │
│   ├── hooks/
│   │   └── useBehaviorTracking.ts   # React hook — manages tracking lifecycle
│   │
│   ├── services/
│   │   └── api.ts               # Backend API calls
│   │
│   ├── utils/
│   │   └── featureBuilder.ts    # Builds ML payload + computes analytics
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install and run

```bash
cd frontend
npm install
npm run dev
```

Opens at **http://localhost:5173**

### Build for production

```bash
npm run build
```

Output goes to `frontend/dist/`

---

## How It Works

Tracking starts the moment the page loads — no user interaction required.

Every **5 seconds**, the collected signals are batched and sent to the backend:

```json
{
  "mouse_moves": [{ "x": 412, "y": 233, "time": 1712000000000 }],
  "clicks": [1712000001200],
  "keystrokes": [1712000002100, 1712000002280],
  "scrolls": [{ "position": 120, "time": 1712000003000 }],
  "session_time": 15
}
```

The backend returns:

```json
{
  "human_score": 0.91,
  "decision": "human"
}
```

### Verification states

| State | Meaning |
|---|---|
| `human` | Score > 0.75 — access granted |
| `uncertain` | Score 0.50–0.75 — fallback slider shown |
| `bot` | Score < 0.50 — access restricted |

---

## Backend Integration

The frontend expects a running backend at:

```
POST http://localhost:8000/verify-human
```

If the backend is offline, the frontend automatically falls back to a **demo mode** — it simulates a score based on the collected signals so the UI remains fully functional for testing.

---

## Signals Tracked

| Signal | What is collected |
|---|---|
| Mouse movement | x, y coordinates + timestamp (throttled to ≥4px movement) |
| Clicks | Timestamp of each click event |
| Keystrokes | Timestamp of each keydown event |
| Scroll | Scroll position + timestamp |
| Session time | Total time since page load in seconds |

No keypress content is ever recorded — only timing.

---

## Live Analytics Panel

The dashboard shows real-time metrics computed from collected signals:

- **Mouse movement count** — total recorded positions
- **Click frequency** — clicks per minute
- **Typing speed** — keystrokes per minute
- **Scroll activity** — scroll events per minute
- **Session time** — live counter since page load
- **Avg mouse velocity** — pixels per second
- **Path entropy** — 0–1 score of mouse movement naturalness

---

## Environment

No `.env` file is required for the frontend. The backend URL is set directly in:

```
src/services/api.ts → const API_BASE = 'http://localhost:8000'
```

Change this value if your backend runs on a different port or host.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:5173 |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
