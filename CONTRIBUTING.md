# Contributing to Scribbl

Thank you for your interest in contributing to **Scribbl**! We welcome bug reports, feature enhancements, new drill sets, calligraphy rulings, and performance improvements.

## 🌟 Philosophy

Scribbl is designed to be:
1. **Offline-first & zero-telemetry**: Everything runs in the browser via IndexedDB. No accounts, no analytics, no backend servers.
2. **Tablet-first**: Optimized for graphic tablets (Gaomon, Wacom, Huion, XP-Pen, Apple Pencil).
3. **High-performance**: 60fps+ (120Hz/144Hz supported) zero-allocation rendering using Canvas 2D and Pointer Events.
4. **Accessible to non-tablet contributors**: Fixture-based tests allow developers without physical pen hardware to verify stroke recognition and drawing logic.

## 🛠️ Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/scribbl.git
   cd scribbl
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```

4. **Run unit & fixture tests**:
   ```bash
   npm run test
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## 🧪 Testing Without a Physical Graphic Tablet

If you do not have a graphic tablet (like Gaomon S620), you can test features using:
- **Fixture Tests**: Located in `tests/fixtures/`, capturing real raw pointer data (`x`, `y`, `pressure`, `tiltX`, `tiltY`, `timestamp`). Run `npm run test` to verify.
- **Diagnostics Mode**: Visit the Diagnostics tab to simulate or inspect pointer events.
- **Mouse / Touch fallback**: Pointer event fallbacks automatically simulate smooth pressure curves for mouse and touch inputs.

## 🎨 Code Style

- TypeScript strict mode is enabled.
- Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) are used throughout components.
- Do not introduce runtime allocations within the `requestAnimationFrame` canvas render loop.
- Use the derived color palette: `#008bd8` (brand cyan/blue accent) and `#020202` (deep ink black).

## 📄 License

By contributing to Scribbl, you agree that your contributions will be licensed under the [MIT License](LICENSE).
