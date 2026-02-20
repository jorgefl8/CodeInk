<div align="center">
  <a href="https://codeink.app">
    <img
      src="https://codeink.app/favicon.svg"
      alt="CodeInk Logo"
      height="60"
    />
  </a>
  <p />
  <p>
    <b>
      CodeInk is a free, open-source online Markdown editor with a clean, professional UI. Real-time preview, Mermaid diagrams, KaTeX math, syntax highlighting, and markdown linting. 100% client-side — your documents never leave your browser.
    </b>
  </p>

<a href="https://codeink.app">Get Started</a>
<span>&nbsp;&nbsp;✦&nbsp;&nbsp;</span>
<a href="https://codeink.app/markdown-cheat-sheet">Markdown Cheat Sheet</a>
<span>&nbsp;&nbsp;✦&nbsp;&nbsp;</span>
<a href="#-license">License</a>

<img
  src="https://codeink.app/images/screenshot.png"
  alt="CodeInk — Free online Markdown editor screenshot"
/>

</div>

<div align="center">

![Astro Badge](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=fff&style=flat)
![Tailwind CSS Badge](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=fff&style=flat)
![TypeScript Badge](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff&style=flat)
![Bun Badge](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=fff&style=flat)
![GitHub stars](https://img.shields.io/github/stars/jorgefl8/codeink)
![GitHub issues](https://img.shields.io/github/issues/jorgefl8/codeink)

</div>

## Features

- **Real-time Markdown preview** — split-pane editor with instant rendering
- **Mermaid diagrams** — flowcharts, sequence diagrams, ER diagrams, Gantt charts, class diagrams, and more
- **KaTeX math** — inline and display mode LaTeX expressions
- **Syntax highlighting** — 16+ languages via Shiki with One Dark Pro theme
- **GitHub-style alerts** — NOTE, TIP, IMPORTANT, WARNING, CAUTION
- **Tables and footnotes** — full GFM support
- **100% client-side** — your documents never leave your browser
- **Zero tracking** — no analytics, no cookies, no accounts
- **Installable PWA** — install CodeInk on desktop or mobile from supported browsers
- **Local storage** — documents saved via IndexedDB
- **Offline-ready** — `/editor` and `/documents` work offline after first load
- **Markdown linting** — real-time diagnostics via remark-lint with one-click auto-fix
- **Multiple view modes** — editor, split, and preview modes with resizable panes
- **Export** — Markdown export

## Development

### Prerequisites

- [Bun](https://bun.sh) installed on your system
- Node.js 18+ (optional)

### Local Development

```bash
# Clone the repository
git clone https://github.com/jorgefl8/codeink.git
cd codeink

# Install dependencies
bun install

# Start development server
bun dev
```

The development server will start at `http://localhost:4321`

### Build for Production

```bash
bun run build
```

## PWA Notes

- First load must happen online so the service worker can cache app routes and assets.
- After that, `/editor` and `/documents` are available offline from cache + IndexedDB.
- Other static routes are best-effort offline and may show `/offline` if not cached yet.

### Test PWA Locally

1. Run `bun dev` and open the app in Chrome.
2. Visit `/editor` and `/documents` once while online.
3. Open DevTools > Application > Service Workers and confirm registration.
4. Switch DevTools Network to Offline and reload `/editor` or `/documents`.
5. Verify install CTA appears when `beforeinstallprompt` is available.

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/jorgefl8/codeink/blob/main/LICENSE) file for details.
