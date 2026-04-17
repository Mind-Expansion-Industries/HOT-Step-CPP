# HOT-Step CPP — Final Architecture

## Architecture: Option B — Node.js + Enhanced ace-server

**One terminal window. Two processes. All the power.**

```
LAUNCH.bat
  └→ node server.js
       ├── Express on :3001
       │    ├── Serves React frontend (pre-built dist/)
       │    ├── /api/songs, /api/playlists  → SQLite
       │    ├── /api/generate               → orchestrates ace-server calls
       │    ├── /api/lireek/*               → Lyric Studio (SQLite)
       │    ├── /api/cover-studio/*          → Cover Studio (SQLite)
       │    └── /audio/:file                → serves saved audio files
       │
       └── Spawns child process:
            ace-server-hs.exe --models ... --adapters ... --port 8085
```

### Why Option B over Option A

You're right that JSON doesn't cut it. Lyric Studio alone has:
- **Artists** → **Albums** → **Songs** (relational hierarchy)
- Lyrics with section markers, drafts, versions
- LLM conversation history per song
- Tag systems, ratings, search

Cover Studio adds stem presets, artist configurations, reference track associations. This is **relational data** — SQLite is the right answer, and Node.js is where it lives.

The critical achievement: **still just one LAUNCH.bat, one terminal, one Ctrl+C**. Node.js manages ace-server as a child process. Down from 5 terminals to 1.

---

## Iteration Speed — Honest Comparison

> **"How much slower is C++ iteration vs Python?"**

Short answer: **daily development is actually _faster_**. The C++ concern is almost entirely irrelevant.

| What you're changing | Current (Python) | New (C++ engine) |
|---|---|---|
| **UI components, styling, interactions** | Vite HMR — instant | Vite HMR — **identical** |
| **Server routes, DB queries, API logic** | Node restart: ~1s | Node restart: ~1s, **ace-server stays running** |
| **Generation engine internals** | Python restart: 30-60s (model reload) | C++ incremental rebuild: 30-90s |
| **Adding a new solver** | Edit .py, restart: 30-60s | Edit .h, rebuild: 30-90s, restart: ~2s |

The generation engine (C++ layer) changes **rarely** — once we implement Heun/DPM++/etc., that code is stable for weeks. Meanwhile, 95% of daily work (UI, features, API routes) iterates at the same speed or faster because:

1. Vite HMR is identical
2. Node.js restart doesn't require model reloading (ace-server keeps models hot)
3. No 30-60 second Python startup penalty on every server restart

### Build speed optimization

The distributed acestep.cpp build targets every CUDA architecture (Turing → Blackwell) for binary compatibility. For local dev, we use:

```cmd
cmake .. -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=native
```

This compiles ONLY for your actual GPU. Full build: **2-3 minutes** instead of 10+. Incremental (one `.h` changed): **30-60 seconds**.

---

## Core Constraint

> [!CAUTION]
> **The user's `D:\Ace-Step-Latest\acestepcpp\acestep.cpp\` is NEVER modified.**
> We maintain our own patched copy in `hot-step-cpp/engine/`.
> Both point to the same `models/` and `adapters/` directories.
> The user can run vanilla `server.cmd` anytime — it still works.

---

## Project Structure

```
D:\Ace-Step-Latest\hot-step-cpp\
│
├── engine/                           # Our patched acestep.cpp build
│   ├── acestep.cpp/                  # Cloned source (git submodule or copy)
│   ├── patches/                      # Our extensions
│   │   ├── 001-custom-solvers.patch  # Heun, DPM++2M, DPM++3M, RK4, JKASS
│   │   ├── 002-schedulers.patch      # bong_tangent, linear_quadratic, etc.
│   │   └── 003-guidance-modes.patch  # PAG, interval CFG, etc.
│   ├── apply-patches.bat             # Applies patches to source
│   └── build.bat                     # cmake + build → ace-server-hs.exe
│
├── ui/                               # React + Vite frontend
│   ├── src/
│   │   ├── components/               # UI components
│   │   │   ├── CreatePanel.tsx       # Generation form
│   │   │   ├── Player.tsx            # Audio player
│   │   │   ├── SongList.tsx          # Song library
│   │   │   ├── Sidebar.tsx           # Navigation
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.ts                # API client
│   │   ├── stores/                   # State management
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── App.tsx
│   │   └── types.ts
│   ├── index.html
│   ├── vite.config.ts                # Dev proxy to :3001
│   └── package.json
│
├── server/                           # Node.js middleware
│   ├── src/
│   │   ├── index.ts                  # Express entry + child process management
│   │   ├── config.ts                 # Env-based configuration
│   │   ├── db/
│   │   │   └── database.ts           # SQLite schema + migrations
│   │   ├── routes/
│   │   │   ├── auth.ts               # Simple local auth
│   │   │   ├── songs.ts              # Song CRUD + audio serving
│   │   │   ├── generate.ts           # Orchestrates ace-server calls
│   │   │   ├── models.ts             # Model listing (proxies /props)
│   │   │   ├── playlists.ts          # Playlist management
│   │   │   └── health.ts             # Health + logs proxy
│   │   └── services/
│   │       └── aceClient.ts          # HTTP client for ace-server-hs
│   ├── data/                         # SQLite DB + audio files
│   │   ├── hotstep.db                # SQLite database
│   │   └── audio/                    # Saved audio files
│   └── package.json
│
├── .env                              # Configuration
├── install.bat                       # Full setup: clone engine, patches, build, npm install
├── LAUNCH.bat                        # Start app (one terminal, one command)
├── dev.bat                           # Dev mode: node + vite with HMR
└── README.md
```

---

## .env Configuration

```env
# ace-server-hs configuration
ACESTEPCPP_MODELS=D:\Ace-Step-Latest\acestepcpp\acestep.cpp\models
ACESTEPCPP_ADAPTERS=D:\Ace-Step-Latest\acestepcpp\acestep.cpp\adapters
ACESTEPCPP_PORT=8085
ACESTEPCPP_HOST=127.0.0.1

# Node.js server
SERVER_PORT=3001
DATA_DIR=./server/data

# Dev mode
VITE_PORT=3000
VITE_HOST=0.0.0.0
```

---

## Generation Flow

```
Browser (React)                     Node.js (:3001)              ace-server-hs (:8085)
    │                                   │                              │
    ├─ POST /api/generate ────────→     │                              │
    │   {caption, lyrics, ...}          │                              │
    │                                   ├─ Translate params            │
    │                                   ├─ POST /lm ──────────────→    │
    │                                   │                         ←──  │ {"id":"abc"}
    │                                   ├─ Poll GET /job?id=abc ──→    │
    │                                   │                         ←──  │ {"status":"done"}
    │                                   ├─ GET /job?id=abc&result=1 →  │
    │                                   │                         ←──  │ [enriched JSON]
    │                                   ├─ POST /synth ───────────→    │
    │                                   │                         ←──  │ {"id":"def"}
    │                                   ├─ Poll GET /job?id=def ──→    │
    │                                   │                         ←──  │ {"status":"done"}
    │                                   ├─ GET /job?id=def&result=1 →  │
    │                                   │                         ←──  │ audio/mpeg
    │                                   ├─ Save audio to disk          │
    │                                   ├─ Save song to SQLite         │
    │  ←──────────────────────────      │                              │
    │   {song with audioUrl}            │                              │
```

The Node.js server orchestrates the two-step flow (LM → synth) and handles persistence. The frontend just shows progress and plays the result.

---

## Parameter Translation (Frontend → AceRequest)

```typescript
// Frontend GenerationParams → AceRequest JSON
{
  prompt/songDescription  → caption
  lyrics                  → lyrics (or "[Instrumental]" if instrumental)
  bpm                     → bpm
  duration                → duration
  keyScale                → keyscale
  timeSignature           → timesignature
  vocalLanguage           → vocal_language
  inferenceSteps          → inference_steps
  guidanceScale           → guidance_scale
  shift                   → shift
  seed (if !randomSeed)   → seed
  batchSize               → lm_batch_size / synth_batch_size
  lmTemperature           → lm_temperature
  lmCfgScale              → lm_cfg_scale
  lmTopK                  → lm_top_k
  lmTopP                  → lm_top_p
  lmNegativePrompt        → lm_negative_prompt
  inferMethod             → infer_method  (ode|sde|heun|dpm2m|...)
  ditModel                → synth_model
  lmModel                 → lm_model
  loraPath                → adapter
  loraScale               → adapter_scale
  audioCoverStrength      → audio_cover_strength
  coverNoiseStrength      → cover_noise_strength
  taskType                → task_type
  trackName               → track
  repaintingStart         → repainting_start
  repaintingEnd           → repainting_end
  useCotCaption           → use_cot_caption
}
```

---

## Phased Implementation

### Phase 1: Foundation + Text2Music ← START HERE

**Engine setup:**
- [ ] Clone acestep.cpp source into `engine/`
- [ ] Create `build.bat` with CUDA + native arch
- [ ] Build vanilla ace-server-hs.exe (no patches yet - verify it works first)
- [ ] Test: `ace-server-hs.exe --models ... --port 8085` → `GET /health`

**Node.js server:**
- [ ] Scaffold Express + TypeScript project in `server/`
- [ ] `aceClient.ts` — HTTP client wrapping ace-server endpoints
- [ ] `database.ts` — SQLite schema: users, songs tables
- [ ] `auth.ts` — Simple local auto-auth
- [ ] `songs.ts` — Song CRUD + audio file serving
- [ ] `generate.ts` — Orchestration: accept params → translate → LM → poll → synth → poll → save
- [ ] `models.ts` — Proxy `/props` from ace-server
- [ ] `health.ts` — Health check + connectivity status
- [ ] Child process management — spawn/manage ace-server-hs

**React frontend:**
- [ ] Scaffold Vite + React + TypeScript in `ui/`
- [ ] Core layout: Sidebar + Create Panel + Player (adapt from hot-step-9000)
- [ ] Create Panel: caption, lyrics, metadata fields
- [ ] Generation settings: steps, guidance, shift, seed, solver (ode/sde initially)
- [ ] LM settings: temp, cfg, top_k, top_p, negative prompt
- [ ] Model selection dropdowns (from /props)
- [ ] Generation queue: submit, poll progress, cancel
- [ ] Song library: list, play, delete
- [ ] Audio player with playback controls

**Launch scripts:**
- [ ] `LAUNCH.bat` — starts Node (which spawns ace-server-hs)
- [ ] `dev.bat` — Node + Vite concurrently
- [ ] `install.bat` — full setup

### Phase 2: Engine Patches + Advanced Generation
- [ ] Create solver patches (Heun, DPM++2M, RK4)
- [ ] Create scheduler patches
- [ ] Cover mode (audio upload, multipart proxy)
- [ ] Repaint mode (region selector)
- [ ] Lego/Extract/Complete modes
- [ ] Adapter selection from /props
- [ ] Batch generation (synth_batch_size)
- [ ] Format/Inspire modes

### Phase 3: Library & Features
- [ ] Playlists (create, manage, play)
- [ ] Song profiles (detail page)
- [ ] Settings modal (all config options)
- [ ] Download modal (MP3/WAV)
- [ ] AI cover art (Gemini API)
- [ ] Search
- [ ] User profile

### Phase 4: Studio Features
- [ ] Lyric Studio (SQLite + LLM APIs)
- [ ] Cover Studio (stem separation via external tool)
- [ ] Mastering console (Web Audio API or external)
- [ ] Debug panel (ace-server logs via SSE)
- [ ] Visualizer / waveform display
- [ ] A/B compare

### Phase 5: Extended Engine Features
- [ ] PAG guidance patch
- [ ] Advanced CFG modes (interval, omega, ERG)
- [ ] JKASS solver
- [ ] STORK solver
- [ ] Any remaining hot-step-9000 parity features

---

## Verification Plan

### After Phase 1:
```powershell
# Type-check frontend
cd D:\Ace-Step-Latest\hot-step-cpp\ui
npx tsc --noEmit

# Type-check server
cd D:\Ace-Step-Latest\hot-step-cpp\server
npx tsc --noEmit

# Test ace-server-hs connectivity
curl http://localhost:8085/health
curl http://localhost:8085/props

# Test Node.js server
curl http://localhost:3001/api/health

# End-to-end: generate a song through the UI
# → Verify audio plays, appears in library, persists across restart
```

### Manual verification:
- Start app via `LAUNCH.bat`
- Open browser → verify UI loads at `http://localhost:3001`
- Submit a text2music generation
- Verify progress updates in the UI
- Verify audio plays back
- Verify song appears in library
- Restart app → verify library persists
- Test cancel functionality
- Test model switching
