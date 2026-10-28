# Scribbl 🖊️

> An open-source (MIT), offline-capable Progressive Web App for mastering handwriting and drawing with graphic tablet pens.

Developed and calibrated against the **Gaomon S620** graphic tablet, **Scribbl** is built for any drawing tablet, Apple Pencil, or active stylus (Wacom Intuos/One, Huion Inspiroy, XP-Pen Deco, etc.).

![Scribbl Logo](public/logo.svg)

---

## ⚡ Key Highlights

- **Direct Hardware Input**: Leverages the W3C Pointer Events API (`getCoalescedEvents()` and `getPredictedEvents()`) for ultra-low latency, capturing every micro-stroke up to the tablet's maximum polling frequency (e.g. 266 PPS).
- **Zero-Allocation 60fps+ Canvas 2D**: Desynchronized canvas (`{ desynchronized: true, alpha: false }`) coupled with a committed offscreen layer renders smooth, dynamic strokes via `perfect-freehand` with zero garbage collection spikes.
- **Screenless Tablet Support**: Because graphic tablets like the Gaomon S620 lack built-in screens, Scribbl features a responsive **Hover Cursor** that projects brush diameter, center pip, and tilt vectors whenever the stylus hovers 1–10mm above the surface.
- **Aspect Ratio Matching**: Defaults to **16:10** to physically map 1:1 with the Gaomon S620 active area ($6.5 \times 4.0\text{ inches}$), eliminating spatial distortion. Includes 16:9, 4:3, 3:2, 1:1, and Fit-to-Screen modes.
- **Three Practice Modes**:
  1. **Handwriting Practice**: Traceable letters (A–Z, a–z, 0–9), words, custom text generator, ascender/descender/midline/slant guides, and Seyès French ruling.
  2. **Drawing Drills**: Straight line precision, freehand circles, isometric ellipses, and pressure gradient control ribbons.
  3. **Free Canvas**: Multi-brush suite (pen, calligraphy nib, pencil, highlighter, eraser), paper textures, and vector SVG / high-res PNG / JSON export.
- **Intelligent Stroke Scoring**: Evaluates user handwriting using spatial resampling, normalized bounding boxes, and **$P Point-Cloud Recognizer / DTW algorithms** across three dimensions:
  - **Shape Accuracy** (0–100%)
  - **Stroke Order** (verifying natural stroke sequencing)
  - **Stroke Direction** (preventing reverse or retrograde strokes)
- **Session Replay**: Lossless time-series playback of any drawing session with variable speed (0.5x–4x) and pressure visualizer.
- **Device Diagnostics**: Real-time hardware inspector displaying pointer type, live pressure range, tilt angle, polling rate (PPS/Hz), coalesced event counter, and barrel button triggers.
- **100% Offline & Private**: Built on Dexie (IndexedDB). No trackers, no accounts, no cloud dependencies. Works completely offline as a PWA.

---

## 🚀 Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `B` | Pen / Brush tool |
| `C` | Calligraphy Chisel tool |
| `P` | Pencil tool |
| `H` | Highlighter tool |
| `E` | Eraser tool (or flip pen if equipped with eraser end) |
| `[` / `]` | Decrease / Increase brush diameter |
| `Ctrl + Z` / `Cmd + Z` | Undo last stroke |
| `Ctrl + Y` / `Cmd + Y` | Redo stroke |
| `Space + Drag` | Pan canvas |
| `Del` / `Backspace` | Clear active practice canvas |
| `R` | Trigger session replay |

---

## 🛠️ Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev) (Runes: `$state`, `$derived`, `$effect`)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Modern CSS design system derived from the Scribbl logo palette (`#008bd8` cyan-blue, `#020202` obsidian ink)
- **Stroke Generation**: [`perfect-freehand`](https://github.com/steveruizok/perfect-freehand)
- **Local Database**: [`Dexie.js`](https://dexie.org) (IndexedDB)
- **PWA**: `vite-plugin-pwa` with automatic service worker updates
- **Testing**: `vitest` with simulated fixture-based pointer data

---

## 📦 Getting Started

### Prerequisites
- Node.js $\ge 18$
- npm $\ge 9$

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/your-username/scribbl.git
cd scribbl

# Install dependencies
npm install

# Start development server
npm run dev
```

### Running Tests
Contributors do not need a physical graphic tablet to develop or verify stroke algorithms. Realistic pointer recordings are bundled as test fixtures:
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

---

## 📜 License

Distributed under the [MIT License](LICENSE).
