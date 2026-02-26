# Mini Notion Clone

## The Big Picture

A lightweight Notion-inspired note-taking app built with Next.js. You get a sidebar with pages, a block-based editor, slash commands, drag-and-drop reordering, and image support -- all persisted to a single JSON file on disk. No database, no auth, no external services. Just a clean, dark-themed editor that runs locally.

## Technical Architecture

The app is a **Next.js 16 App Router** project using React 19. There's no database -- everything lives in `data/pages.json`. The server reads and writes this file through a locking layer that prevents corruption.

Think of it like this: the **sidebar** is the table of contents, each **page** is a document, and each page contains **blocks** (text or images) that you can type into, reorder, and transform.

### Request lifecycle

When you click a page in the sidebar:

1. Browser navigates to `/pages/{id}`
2. Next.js server component (`src/app/pages/[id]/page.tsx`) reads `pages.json` via `lib/pages.ts`
3. Page data (name + blocks) is passed to `<PageEditor>` (client component)
4. `PageEditor` owns the blocks array in React state and renders each through `BlockWrapper` -> `BlockRenderer` -> `TextBlock` or `ImageBlock`
5. As you type, changes are debounced (200ms) and sent to `PATCH /api/pages/[id]/blocks`
6. The API route acquires the file lock, writes to a temp file, and atomically renames it into place

### Component hierarchy

```
PageEditor (client, owns blocks state + saving)
  └── BlockWrapper (drag handle, hover menu, type changer)
       └── BlockRenderer (dispatches by block.type)
            ├── TextBlock (contentEditable, slash commands, keyboard nav)
            └── ImageBlock (renders image, click to edit)
```

## Codebase Structure

```
src/
├── app/                          # Next.js App Router
│   ├── globals.css               # Reset + theme import
│   ├── layout.tsx                # Root layout: sidebar + main content area
│   ├── page.tsx                  # Home page (welcome screen)
│   ├── page.module.css
│   ├── pages/[id]/page.tsx       # Dynamic page view (server component -> PageEditor)
│   └── api/pages/                # REST API
│       ├── route.ts              # GET all, POST new page
│       └── [id]/
│           ├── route.ts          # GET, PUT, DELETE single page
│           └── blocks/route.ts   # PATCH blocks array
├── components/
│   ├── Sidebar.tsx               # Page list, create/rename/delete, collapsible
│   ├── Sidebar.module.css
│   ├── Dialog.tsx                # Reusable modal component
│   ├── Dialog.module.css
│   ├── ImageBlockDialog.tsx      # Image URL + dimensions dialog
│   ├── ImageBlockDialog.module.css
│   └── blocks/                   # Block editing system
│       ├── PageEditor.tsx        # Orchestrator: state, saving, focus, drag
│       ├── BlockWrapper.tsx      # Drag handle, hover menu, style changer
│       ├── BlockRenderer.tsx     # Type dispatcher (text vs image)
│       ├── TextBlock.tsx         # contentEditable with slash commands
│       ├── ImageBlock.tsx        # Image display, click to edit
│       └── *.module.css          # Scoped styles for each
├── lib/
│   ├── filelock.ts               # Promise-chain lock for serialized file access
│   └── pages.ts                  # CRUD operations on pages.json
├── styles/
│   └── theme.css                 # CSS custom properties (dark theme)
└── types/
    ├── block.ts                  # BaseBlock, TextBlock, ImageBlock, Block union
    ├── page.ts                   # Page interface
    └── index.ts                  # Barrel exports
data/
    └── pages.json                # All page data (array of Page objects)
```

**Where to look first when debugging:**
- Block editing bugs -> `src/components/blocks/TextBlock.tsx`
- Save not working -> `src/lib/pages.ts` or `src/app/api/pages/[id]/blocks/route.ts`
- Styling off -> `src/styles/theme.css` (CSS variables) or the relevant `.module.css`
- Sidebar issues -> `src/components/Sidebar.tsx`

## Technologies & Why We Chose Them

| Technology | Why |
|---|---|
| **Next.js 16 (App Router)** | Server components for initial page load, API routes for CRUD, file-system routing. Overkill for a local app, but great for learning the App Router pattern. |
| **React 19** | Latest React with `useSyncExternalStore` for media queries, server components. |
| **TypeScript** | Non-negotiable for any project with more than one file. |
| **CSS Modules + Custom Properties** | Scoped styles without build-time overhead. Theme variables in one file mean adding a light theme is a single `[data-theme="light"]` block. No Tailwind needed for a project this size. |
| **JSON file persistence** | Simplest possible backend. No database to set up, no migrations, no ORM. The tradeoff is single-process only and no concurrent multi-user support. |
| **`contentEditable`** | The browser's built-in rich text editing. Avoids pulling in a heavy editor library (ProseMirror, TipTap, Slate). The tradeoff is fighting browser quirks. |

**What we'd choose differently:** If this grew, we'd swap the JSON file for SQLite (still local, but handles concurrency) and replace raw `contentEditable` with TipTap or Slate for proper rich text.

## API Reference

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/api/pages` | GET | -- | `[{ id, name }]` |
| `/api/pages` | POST | `{ name }` | Full page with seeded empty block |
| `/api/pages/[id]` | GET | -- | Full page with blocks |
| `/api/pages/[id]` | PUT | `{ name }` | Updated page |
| `/api/pages/[id]` | DELETE | -- | `{ success: true }` |
| `/api/pages/[id]/blocks` | PATCH | `{ blocks: Block[] }` | `{ blocks: Block[] }` |

## Data Model

**Page**: `{ id: uuid, name: string, blocks: Block[] }`

**Block** (discriminated union on `type`):
- **TextBlock**: `{ id, type: "text", content: string, style: "h1" | "h2" | "h3" | "p" }`
- **ImageBlock**: `{ id, type: "image", source: string, width: number, height: number }`

Block ordering is determined by array position -- no separate `order` field.

## Key Features

### Slash Commands
Type in an empty text block:
- `/h1`, `/h2`, `/h3`, `/p` + Space/Enter -> changes the block style
- `/image` + Space/Enter -> opens the image dialog

### Keyboard Navigation
- **Enter** (no Shift): creates a new text block below, focuses it
- **Shift+Enter**: line break within the block
- **Backspace on empty block**: deletes it, focuses the previous text block

### Drag and Drop
Blocks can be reordered by dragging the grip handle (dots icon on hover). Uses HTML5 drag API with ID-based tracking to avoid index staleness during reorder.

### Debounced Saving
Content saves 200ms after typing stops, and immediately on blur. Prevents excessive writes while keeping data reasonably fresh.

### Safe File I/O
Two layers of protection:
1. **Promise-chain lock** (`src/lib/filelock.ts`): serializes all reads and writes so they never overlap
2. **Atomic temp-file writes**: data is written to `pages.json.tmp` then renamed into place, so a crash mid-write can't corrupt the main file

### Theming
CSS custom properties in `src/styles/theme.css`. Currently dark theme only. Adding light theme = one new `[data-theme="light"]` block with overridden values.

### Responsive Sidebar
Collapses automatically on mobile (<768px). Toggle button available at all screen sizes. Overlay backdrop on mobile when open.

## Getting Started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). Create a page from the sidebar and start typing.

## Known Limitations

- **Debounced saving (200ms)**: If the user closes the browser within 200ms of their last keystroke, that final edit is lost. A `beforeunload` handler or IndexedDB buffer would close this gap.
- **Single process only**: The file lock is in-memory, so running multiple server instances would bypass it. Use SQLite or a real database for multi-process deployments.
- **No undo/redo**: contentEditable has basic browser undo, but block-level operations (delete, reorder, type change) aren't undoable.
- **No collaborative editing**: Single JSON file, no operational transforms or CRDTs.
- **Image blocks use raw `<img>`**: No Next.js `<Image>` optimization (would require domain whitelisting for arbitrary URLs).
