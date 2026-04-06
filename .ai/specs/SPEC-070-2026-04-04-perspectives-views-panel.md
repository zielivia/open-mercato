# SPEC-070: Perspectives Views Panel Redesign (v2)

## Overview

Redesign the perspectives UI panel (`PerspectiveSidebar.tsx`) to provide an intuitive views management experience with field search, chip-based view switching, autosave, and streamlined column management. This replaces the current "perspectives" mechanism with a user-friendly "Views" panel.

**Reference:** T-FE-02

---

## Problem Statement

The current `PerspectiveSidebar` has several UX issues:

1. **No field search** in column configuration — users with 20+ columns must scroll through the entire list.
2. **Unintuitive "perspectives" terminology** — industry-standard term is "views" (Notion, Airtable, Linear).
3. **Confusing private/public split** — "My perspectives" and "Role perspectives" as separate sections is unclear.
4. **Clunky view switching** — requires opening the sidebar, finding the view, and clicking. No quick-switch.
5. **Column reordering with arrows only** — slow for large column sets. Drag-and-drop needed.
6. **Heavy save flow** — dedicated "Save current view" section with footer buttons is overkill for simple column toggles.

---

## Proposed Solution

A frontend-only redesign. The backend API and data model remain unchanged — with one exception: a new `source_perspective_id` FK on `RolePerspective` to enable reliable clone/share tracking (see section 9).

### 1. Rename "Perspectives" to "Views"

All user-facing labels change:

- "My perspectives" → removed (replaced by chips)
- "Role perspectives" → removed (replaced by chips with Users icon)
- "Save perspective" → removed (replaced by chip "+ New" and autosave)
- Update all i18n keys: `ui.perspectives.*` → `ui.views.*` (keep old keys as fallbacks)

### 2. Views as Chips (replaces tabs and separate sections)

**Decision:** Tabs ([Private] [Shared]) and dropdown filter (All/Mine/Shared) were both considered and rejected. Chips provide the most intuitive single-select pattern for a small number of views.

**Layout:** Under heading "SAVED VIEWS" (12px, uppercase, muted), chips render in `flex-wrap` with `gap: 6px`.

**Chip "+ New"** (always first):
- Dashed border, `Plus` icon (lucide), text "New"
- Click → chip highlights, inline form appears below chips:
  - `input "View name..."` with `border-info`
  - `Check` icon (lucide) — blue (`text-primary`) when input has text, gray when empty
  - `X` icon (lucide) — cancels (Esc also works)
  - Enter or click Check = saves new view with current column configuration

**Existing view chips:**
- Outline border, view name, vertical `MoreVertical` (lucide) dots
- **Shared views** have `Users` icon (lucide) BEFORE the name — no text badge
- **Active chip** = filled background (`bg-primary/10`, `text-primary`, `font-medium`)
- **Inactive chip** = transparent, `border-secondary`, `text-secondary`
- Click on chip = switches view, loads its column config. **Sidebar stays open** (does not close).

**On panel open:** Default view is auto-selected (chip highlighted, columns loaded, "Set as default" checked). If no default → nothing selected, all columns visible.

### 3. Context Menu (⋮) on Chips

Click `MoreVertical` on a chip opens a `DropdownMenu` with:

1. `Pencil` **Rename** — chip becomes inline input with `Check` ✓ + `X` ✕. Enter confirms, Esc cancels.
2. `Copy` **Clone** — creates NEW view with `structuredClone()` + new `crypto.randomUUID()` id. Name: "Original (copy)" (with auto-increment if name exists: "copy 2", "copy 3"). Opens in rename mode. **Does NOT mutate original.** Clones shared role assignments via `sharedRoleIds` from source perspective. Validates name uniqueness before save — shows toast "View with this name already exists" on conflict.
3. `Users` **Share with roles...** — closes menu, opens INLINE form below chips (same slot as "+ New"):
   ```
   ┌─────────────────────────────────┐
   │ Share with roles                │
   │ ☐ admin                        │
   │ ☐ employee                     │
   │ ☐ superadmin                   │
   │                       [Apply]  │
   └─────────────────────────────────┘
   ```
   After Apply → chip gets `Users` icon.
4. **separator**
5. `Trash2` **Delete** (red) — confirmation dialog: "Delete «name»? This view will be removed for you and all shared roles. This cannot be undone." Buttons: Cancel + Delete (destructive).

**Menu sizing:**
- Font: `text-sm` (14px), item height: `h-9` (36px), padding: `py-2 px-3`
- Container padding: `p-1.5`, separator before Delete: `my-1`
- ⋮ button on chip: NO gray hover background (`hover:bg-transparent`), only opacity change on hover

### 4. "Set as default" Checkbox

- Positioned between chips section and Columns section
- **Separated** from chips by `border-t` with spacing (`mt-3 pt-3`)
- **Separated** from Columns by `border-b` with spacing (`mb-3 pb-3`)
- Checkbox checked state uses primary color (no gray frame)
- Change triggers autosave

### 5. Field Search in Column Configuration

Search input at the top of COLUMNS section:

- `Search` icon (lucide) left-positioned inside input
- `X` icon (lucide) clear button — visible only when input has text
- Case-insensitive substring match
- Empty state: "No fields matching «query»"
- Counter: "7/10 visible" in `text-primary` next to COLUMNS heading

### 6. Column Rows (new design)

Each column row contains, left to right:

1. **Drag handle** — `GripVertical` (lucide), `opacity-25`, `cursor-grab`. Visual only — no DnD logic until PR #1144 merges with `@dnd-kit`.
2. **Number** — `#1`, `#2`, etc. `text-xs text-muted-foreground`
3. **Name** — `text-sm`, `flex: 1`
4. **Toggle Switch** — replaces checkbox. ON = `bg-primary`, OFF = `bg-gray-400` (sufficient contrast, WCAG AA 3:1)

Disabled column row: `opacity-50`.

**Removed:** ↑↓ arrow buttons (replaced by drag handles).
**Removed:** Checkboxes (replaced by toggle switches).

### 7. Autosave + Toast (replaces footer)

**Removed:** Sticky footer with Discard/Save buttons.

All changes save automatically:
- Toggle column ON/OFF → autosave with debounce (300-500ms)
- "Set as default" checkbox → autosave
- Column reorder (future DnD) → autosave

**Toast notifications:**
- Success: "View saved" (2 seconds, bottom-right, subtle style)
- Error: "Failed to save view" (4 seconds, destructive style)

Uses project's existing toast/notification system (check for `sonner`, `useToast`, or custom).

### 8. Quick View Switcher (Split Button in Toolbar)

**Decision:** Separate chip above DataTable was rejected. Split button group integrates cleanly with existing toolbar.

Replace separate "Views" button + dropdown with one **split button group**:

```
┌──────────────┬──────────────────┐
│  ⊞ Views     │  Condensed  ▾   │
└──────────────┴──────────────────┘
```

- **Left part:** "Views" label + `SlidersHorizontal` icon (lucide) — click opens sidebar
- **Right part:** Active view name + `ChevronDown` (lucide) — click opens dropdown
- Shared border, `h-9`, separator `w-px bg-border` between parts
- When no active view: right part shows "All views"
- Dropdown contains: list of views + "— No view —" (reset to all columns) + active view with checkmark
- Hover: each part highlights independently (`hover:bg-muted`)

### 9. Backend: Stable Link Between Personal and Role Perspectives

**Problem:** The original data model linked `Perspective` (personal) and `RolePerspective` (shared) only by name matching. This caused failures when cloning shared views (name mismatch after rename, race conditions with stale cache).

**Solution:** Add `source_perspective_id` FK to `RolePerspective` entity for deterministic linking.

**Entity change (`RolePerspective`):**
```typescript
@Property({ name: 'source_perspective_id', type: 'uuid', nullable: true })
sourcePerspectiveId?: string | null

@Index({ name: 'role_perspectives_source_idx', properties: ['sourcePerspectiveId'] })
```

**Service changes (`perspectiveService.ts`):**
- `saveRolePerspectives` — stores `sourcePerspectiveId` when creating/updating role perspectives
- `loadPerspectives` — computes `sharedRoleIds: string[]` for each personal perspective by matching `rp.sourcePerspectiveId === personal.id`
- **Cascade rename** — when personal perspective is renamed, all `RolePerspective` records with matching `sourcePerspectiveId` are also renamed

**DTO change (`PerspectiveDto`):**
```typescript
sharedRoleIds?: string[]  // computed, optional, additive-only
```

**API change:** `sharedRoleIds` included in perspective list/save responses. OpenAPI schema updated.

**Migration:** Auto-generated via `yarn db:generate`. Adds nullable UUID column + index. No backfill — progressive linking (new share operations populate FK, old rows stay NULL and get linked on next re-share).

**BC safety:** All changes are additive-only (new nullable column, new optional DTO field). No breaking changes to existing API consumers.

---

## Architecture

### Component Structure

```
packages/ui/src/backend/
├── PerspectiveSidebar.tsx        ← main component, imports children (~150 lines)
├── views/
│   ├── types.ts                  ← shared types for view components
│   ├── ViewChips.tsx             ← chips section (+ New, existing views)
│   ├── ViewChip.tsx              ← single chip + MoreVertical menu
│   ├── ShareForm.tsx             ← inline Share with roles form
│   ├── NewViewForm.tsx           ← inline New view form (input + checkmark)
│   ├── ColumnList.tsx            ← COLUMNS section (search + toggle rows)
│   └── ViewSplitButton.tsx       ← split button in DataTable toolbar
```

**Refactoring rationale:** Original 337-line file grew to ~960 lines. Splitting into focused components improves dev server performance (Turbopack recompiles smaller files faster) and prevents regressions during iterative changes.

### Impact Analysis

**Files modified (frontend):**
- `packages/ui/src/backend/PerspectiveSidebar.tsx` — refactored into parent + children
- `packages/ui/src/backend/DataTable.tsx` — split button integration

**Files modified (backend — for `source_perspective_id` FK):**
- `packages/core/src/modules/perspectives/data/entities.ts` — add `sourcePerspectiveId` property + index on `RolePerspective`
- `packages/core/src/modules/perspectives/services/perspectiveService.ts` — `saveRolePerspectives` stores FK, `loadPerspectives` computes `sharedRoleIds`, cascade rename
- `packages/core/src/modules/perspectives/api/[tableId]/route.ts` — pass `sourcePerspectiveId` to `saveRolePerspectives`
- `packages/core/src/modules/perspectives/api/openapi.ts` — add `sharedRoleIds` to response schema
- `packages/shared/src/modules/perspectives/types.ts` — add `sharedRoleIds?: string[]` to `PerspectiveDto`

**Files created:**
- 7 new UI component files (see structure above)
- 1 migration file (auto-generated via `yarn db:generate`)

**Database migration:** Add `source_perspective_id UUID NULL` + index to `role_perspectives` table. ADDITIVE-ONLY, BC-safe. No backfill of existing rows (progressive linking — new share operations populate the FK, old rows remain NULL).

**UMES events:** No new events. Existing perspective CRUD operations unchanged.

**i18n:** New translation keys under `ui.views.*`. Old `ui.perspectives.*` keys kept as fallbacks.

**Design tokens:** New `--brand-violet` CSS custom property for toggle/checkbox active state color. Added to `apps/mercato` and `template/`.

---

## Dependencies

- `@dnd-kit/core` + `@dnd-kit/sortable` — provided by PR #1144 (DataTable column reordering). Drag handles are visual-only until PR #1144 merges.
- `lucide-react` — already in project. Icons used: `Search`, `X`, `Plus`, `Check`, `GripVertical`, `MoreVertical`, `Pencil`, `Copy`, `Users`, `Trash2`, `SlidersHorizontal`, `ChevronDown`
- No additional dependencies.

---

## Typography Hierarchy

```
18px  semibold  — title "Views"
14px  normal    — column labels, menu items, search placeholder
14px  medium    — chip labels
12px  medium    — section labels (SAVED VIEWS, COLUMNS), uppercase, tracking-wide, muted
12px  normal    — column numbers (#1), counter "7/10 visible"
```

---

## Alternatives Considered

### A. Tabs [Private] [Shared] for view categories
**Rejected** — two empty tabs is worse UX than two empty sections. With few views, tabs add clicks without value. Chips with Users icon on shared views is sufficient.

### B. Dropdown filter (All / Mine / Shared) above chips
**Rejected** — filtering 3-5 chips is overkill. Users icon on shared chips provides enough distinction.

### C. Footer with Discard/Save buttons
**Rejected** — adds friction to simple column toggles. Autosave with debounce + toast is faster and matches modern patterns (Google Docs, Notion).

### D. Chip with active view name above DataTable
**Rejected** — looks like a duplicate of the sidebar. Split button group is cleaner and integrates with toolbar.

### E. Separate "Save current view" section
**Rejected** — heavy form (name, default checkbox, share roles) visible at all times. Replaced by chip "+ New" (creates inline) and context menu actions (rename, share).

### F. Checkboxes for column visibility
**Rejected** — toggle switches are more modern and provide clearer ON/OFF state. Matches the reference UI pattern provided.

### G. Name-match for Perspective ↔ RolePerspective linking
**Rejected** — fragile: breaks after rename (role perspectives keep old name), race conditions with stale cache after share. `source_perspective_id` FK is deterministic.

### H. Cascade rename via name-match only (no FK)
**Rejected** — smaller scope but still fragile. Doesn't solve the fundamental problem of no stable link between entities.

---

## Implementation Phases

### Phase 0: Component Refactor (no visual changes)
- Split `PerspectiveSidebar.tsx` into 7 smaller components
- Keep exact same behavior and appearance
- Verify `yarn lint` + typecheck pass

### Phase 1: Backend — source_perspective_id FK
- Add `sourcePerspectiveId` to `RolePerspective` entity + index
- Generate migration via `yarn db:generate`
- Update `saveRolePerspectives` to store FK
- Update `loadPerspectives` to compute `sharedRoleIds`
- Add cascade rename (rename personal → rename linked role perspectives)
- Add `sharedRoleIds` to `PerspectiveDto` and OpenAPI schema
- Run `yarn lint` + typecheck + existing tests

### Phase 2: Clone Fix
- Use `sharedRoleIds` from DTO instead of name-match
- Deep copy with new UUID, don't mutate original
- Auto-increment name on conflict ("copy 2", "copy 3")
- Validate name uniqueness before save

### Phase 3: Share Inline Form
- Close menu, show form in same slot as "+ New"
- Users icon on shared chips after Apply

### Phase 4: Rename UX
- Add X icon for cancel alongside Check icon
- Check icon: blue when input has text, gray when empty

### Phase 5: Autosave + Toast
- Remove footer with Discard/Save
- Debounced autosave on toggle/default changes
- Toast "View saved" / "Failed to save view"

### Phase 6: Split Button in Toolbar
- Replace separate Views button + dropdown
- "— No view —" option for reset

### Phase 7: UI Polish
- Typography hierarchy (18/14/12px)
- Menu ⋮ sizing (14px font, 36px items)
- Toggle colors (`--brand-violet` ON, gray-400 OFF)
- ⋮ hover: no gray background, opacity only
- Checkbox: `--brand-violet` when checked
- "Set as default" separated by border lines

### Phase 8: Drag-and-Drop Columns (after PR #1144 merge)
- Add `@dnd-kit` sortable to column rows
- Replace visual-only grip handles with functional DnD

---

## Success Metrics

- Users can find a column in <3 seconds (via search) vs current scroll-based approach
- View switching takes 1 click (via split button dropdown) vs current 3 clicks
- View management (rename, clone, share, delete) accessible from single ⋮ menu
- Zero "Save" clicks needed — autosave handles everything
- New users understand "Views" terminology without explanation

---

## Changelog

**2026-04-06 (v3 — backend changes for stable perspective linking)**
- Added `source_perspective_id` FK on `RolePerspective` entity for deterministic clone/share
- Added `sharedRoleIds` computed field to `PerspectiveDto`
- Added cascade rename (personal rename → linked role perspectives renamed)
- Clone now copies shared role assignments and auto-increments name on conflict
- Name uniqueness validation before save with user-facing toast on conflict
- Progressive linking (no backfill of existing data)
- Added `--brand-violet` design token for toggle/checkbox active state
- Updated Implementation Phases: added Phase 1 (backend) before UI phases

**2026-04-06 (v2 — design decisions from implementation)**
- Replaced tabs [Private]/[Shared] with chip-based view selection
- Replaced "Save current view" section with chip "+ New" inline form
- Added context menu ⋮ on chips: Rename, Clone, Share, Delete
- Replaced checkboxes with toggle switches in column rows
- Replaced footer Discard/Save with autosave + toast
- Replaced separate Views button + dropdown with split button group
- Added "Set as default" as separated checkbox between chips and columns
- Updated component structure to 7 files (refactored from single 960-line file)
- Added typography hierarchy and UI sizing specifications

**2026-04-04 (update)**
- Updated dependencies section: @dnd-kit provided by PR #1144 (M.D.)

**2026-04-04**
- Initial specification
