import type { APIRoute } from 'astro';

const content = `\
# CodeInk

## About
CodeInk is a free, open-source online Markdown editor with a clean, professional UI. It runs 100% client-side in the browser. No account required. No tracking. No cookies. Your documents never leave your browser.

## Features
- Real-time Markdown preview
- Mermaid diagram rendering (flowcharts, sequence diagrams, ER diagrams, Gantt charts, class diagrams, and more)
- KaTeX math expression support (inline and display mode)
- Syntax highlighting for 16+ languages via Shiki
- Professional UI with multiple editor view modes (editor, split, preview) and resizable panes
- Export to Markdown
- GitHub-style alerts
- Markdown linting with remark-lint and one-click auto-fix
- Tables and footnotes (GFM)
- Documents saved locally via IndexedDB
- Zero tracking, zero cookies, zero accounts

## Links
- Editor: https://codeink.app/editor
- Documents: https://codeink.app/documents
- Markdown Cheat Sheet: https://codeink.app/markdown-cheat-sheet
- Mermaid Guide: https://codeink.app/mermaid-diagrams-guide
- KaTeX Guide: https://codeink.app/katex-math-guide
- About: https://codeink.app/about
- GitHub: https://github.com/jorgefl8/CodeInk
`;

export const GET: APIRoute = () => {
    return new Response(content, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
