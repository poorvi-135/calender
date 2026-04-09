# Interactive Wall Calendar (Next.js)

A polished frontend-only calendar component inspired by a physical wall calendar layout.

## What this includes

- Wall calendar aesthetic with binder rings, paper-style sheet, and a hero illustration panel.
- Day range selector with clear visual states:
  - start day
  - end day
  - in-between days
- Integrated notes section with two scopes:
  - month notes (for the currently viewed month)
  - range notes (attached to selected date ranges)
- Persistent client-side storage via `localStorage` (no backend).
- Fully responsive behavior:
  - Desktop: split calendar + notes panels
  - Mobile: stacked layout with touch-friendly controls
- Extra UX touches:
  - theme switching
  - quick range presets
  - special day markers
  - lightweight entrance animation

## Tech stack

- Next.js (App Router)
- React + TypeScript
- CSS modules-free custom styling (single component stylesheet)

## Project structure

- `app/page.tsx` - page entry rendering the component
- `components/WallCalendar.tsx` - interactive calendar logic/state/UI
- `components/wall-calendar.css` - all calendar styling
- `app/globals.css` - page-level styling

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open:

```text
http://localhost:3000
```

## Key implementation choices

- Date math uses native `Date` and local date keys (`YYYY-MM-DD`) to avoid timezone-related ISO conversion bugs.
- Range notes are expanded to per-day note markers in memory for efficient dot rendering on the calendar.
- Notes are filtered by tab and sorted by creation timestamp for predictable UI behavior.
- The visual style uses CSS custom properties so themes can switch instantly without rerendering layout structure.

## Video demo checklist

In your recording, show:

1. Selecting a start and end date range.
2. Quick presets (`7 Days`, `14 Days`, `30 Days`, `Today`).
3. Adding single date note can be added.
4. Adding a range note.
5. Range note dot markers appearing on relevant dates.
6. Theme switching.
7. Responsive behavior by resizing to mobile width.

## Deployment

Recommended: Vercel.

```bash
npm run build
npm run start
```

Then deploy the repository to Vercel for a live demo URL.


