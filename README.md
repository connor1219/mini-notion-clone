# Mini Notion Clone

A block-based note-taking app inspired by Notion, built with Next.js 16, React 19, and TypeScript. Data persists to a local JSON file with atomic writes and a promise-chain lock for safety.

## Architecture

```
Browser  <-->  Next.js App Router  <-->  JSON File (data/pages.json)
               ├── Server Components (initial page load)
               ├── Client Components (block editing)
               └── API Routes (CRUD + block saving)
```

### Data Model

- **Page** — `{ id, name, blocks[] }`
- **TextBlock** — `{ id, type: "text", content, style: "h1"|"h2"|"h3"|"p" }`
- **ImageBlock** — `{ id, type: "image", source, width, height }`

Block order is determined by array position.

## Project Structure

```
src/
├── app/                        # Routes + API
│   ├── layout.tsx              # Root layout (sidebar + content)
│   ├── page.tsx                # Home / welcome
│   ├── pages/[id]/page.tsx     # Dynamic page view
│   └── api/pages/              # REST endpoints
│       ├── route.ts            #   GET all, POST new
│       └── [id]/
│           ├── route.ts        #   GET, PUT, DELETE one
│           └── blocks/route.ts #   PATCH blocks array
├── components/
│   ├── Sidebar.tsx             # Collapsible page list + CRUD
│   ├── Dialog.tsx              # Reusable modal
│   ├── ImageBlockDialog.tsx    # Image URL / dimensions editor
│   └── blocks/
│       ├── PageEditor.tsx      # Block state, saving, focus, drag
│       ├── BlockWrapper.tsx    # Drag handle + hover menu
│       ├── BlockRenderer.tsx   # Dispatches text vs image
│       ├── TextBlock.tsx       # contentEditable + slash commands
│       └── ImageBlock.tsx      # Image display + click-to-edit
├── lib/
│   ├── filelock.ts             # Promise-chain lock (generic, reusable)
│   └── pages.ts                # Page CRUD over pages.json
├── styles/theme.css            # CSS custom property theme
└── types/                      # TypeScript interfaces
```

## API

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/pages` | `GET` | List all pages (id + name) |
| `/api/pages` | `POST` | Create page (seeds one empty text block) |
| `/api/pages/[id]` | `GET` | Full page with blocks |
| `/api/pages/[id]` | `PUT` | Rename page |
| `/api/pages/[id]` | `DELETE` | Delete page |
| `/api/pages/[id]/blocks` | `PATCH` | Bulk-update blocks array |

## Features

- **Slash commands**: `/h1`, `/h2`, `/h3`, `/p`, `/image` in empty blocks
- **Keyboard nav**: Enter = new block below, Backspace on empty = delete + focus up
- **Drag and drop**: Reorder blocks via the grip handle
- **Debounced saving**: 200ms after typing stops + immediate on blur
- **Safe file I/O**: Promise-chain lock + atomic temp-file writes
- **Responsive sidebar**: Auto-collapses on mobile, toggleable at all sizes
- **Themeable**: CSS custom properties in one file; adding a light theme is trivial
- **Image blocks**: Auto-detect dimensions, editable via custom dialog, deletable

## Getting Started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Known Limitations

- **Debounced saving (200ms)**: Block content is saved 200ms after the user stops typing, and immediately on blur. If the user closes the browser within 200ms of their last keystroke, that final edit will be lost. Saving on every keystroke was rejected as it creates excessive I/O for a JSON-file backend. For a production app, a `beforeunload` handler or a more robust persistence layer (e.g. IndexedDB + server sync) would close this gap.
- **Single process**: The file lock is in-memory; multiple server instances bypass it.
- **No undo/redo** for block-level operations (delete, reorder, type change).
- **No collaborative editing**: Single JSON file
