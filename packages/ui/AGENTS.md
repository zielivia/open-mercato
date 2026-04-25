# UI Package - Agent Guidelines

UI usage patterns based on customers, sales, and staff modules. Use these defaults when building new UI in `packages/ui` or consuming from other modules.

> **DS reference:** [`.ai/ds-rules.md`](../../.ai/ds-rules.md) — color tokens, typography, spacing, decision trees. **Component reference (variants/sizes/props/examples/MUST rules):** [`.ai/ui-components.md`](../../.ai/ui-components.md).

## Reference Modules

- Customers: `packages/core/src/modules/customers/backend/customers/people/create/page.tsx`, `…/people/page.tsx`, `…/components/detail/TaskForm.tsx`
- Sales: `packages/core/src/modules/sales/components/documents/SalesDocumentsTable.tsx`, `…/PaymentsSection.tsx`, `…/SalesDocumentForm.tsx`
- Staff: `packages/core/src/modules/auth/backend/users/page.tsx`, `…/users/create/page.tsx`, `…/roles/create/page.tsx`

## Component quick reference

When you need… use this. Details (variants, sizes, props, MUST rules) live in [`.ai/ui-components.md`](../../.ai/ui-components.md).

| Need | Component | Import |
|---|---|---|
| Button with text label (with or without icon) | `Button` | `@open-mercato/ui/primitives/button` |
| Icon-only button | `IconButton` | `@open-mercato/ui/primitives/icon-button` |
| Inline link styled as button | `LinkButton` | `@open-mercato/ui/primitives/link-button` |
| OAuth/sign-in button (brand-styled) | `SocialButton` | `@open-mercato/ui/primitives/social-button` |
| Marketing CTA with brand gradient | `FancyButton` | `@open-mercato/ui/primitives/fancy-button` |
| Checkbox primitive (with indeterminate) | `Checkbox` | `@open-mercato/ui/primitives/checkbox` |
| Checkbox with label + description | `CheckboxField` | `@open-mercato/ui/primitives/checkbox-field` |
| Text input (text/email/password/number/etc.) | `Input` | `@open-mercato/ui/primitives/input` |
| User / entity avatar | `Avatar`, `AvatarStack` | `@open-mercato/ui/primitives/avatar` |
| Keyboard shortcut keys | `Kbd`, `KbdShortcut` | `@open-mercato/ui/primitives/kbd` |
| Entity tag pill | `Tag` (with `TagMap`) | `@open-mercato/ui/primitives/tag` |
| Wrap a `<Link>` as button | `Button asChild` / `IconButton asChild` | — |

## Critical MUST rules (top of mind)

1. **NEVER use raw `<button>` or `<input type="checkbox">`** — always use the primitives. Native checkboxes get `accent-color: var(--accent-indigo)` as a safety net for legacy code, but new code MUST use `Checkbox`.
2. **Always pass `type="button"` explicitly** on non-submit `Button`/`IconButton` — HTML defaults to `submit`.
3. **Same-row buttons MUST share `size`.** Mixing `sm` (h-8) + `default`/`icon` (h-9) is a regression. Standardized rows: DataTable toolbar = `default`/`icon` h-9, FormActionButtons = `default` h-9.
4. **NEVER raw `<Link>` styled as a button** — wrap with `<Button asChild>` to inherit size + radius.
5. **`<Button className="h-9">` is an anti-pattern** — redundant with default size, hides contract from grep.
6. **`Checkbox` checked color is `--accent-indigo` (NOT `--primary`)** — matches Figma and distinguishes selection from primary actions.

## CrudForm Guidelines

- Use `CrudForm` as the default for create/edit flows and dialog forms.
- If a backend page cannot use `CrudForm`, use `useGuardedMutation` from `@open-mercato/ui/backend/injection/useGuardedMutation` for every write (`POST`/`PUT`/`PATCH`/`DELETE`).
- Always call writes through `runMutation({ operation, context, mutationPayload })` so global injection modules (e.g. record-lock conflict handling) can run `onBeforeSave`/`onAfterSave`, apply scoped headers, and receive errors consistently.
- Use manual `useInjectionSpotEvents(GLOBAL_MUTATION_INJECTION_SPOT_ID)` only when `useGuardedMutation` is insufficient.
- Keep `CrudForm` reusable — extract shared field/group builders and submit handlers into module-level helpers.
- Drive validation with Zod and surface field errors via `createCrudFormError`.
- With `CrudForm` + Zod, validation messages may be i18n keys (`CrudForm` translates them).
- If you validate outside `CrudForm` or manually map `safeParse(...).error.issues`, you MUST translate `issue.message` before passing to `createCrudFormError`.
- Keep `fields` and `groups` in memoized helpers.
- Pass `entityIds` when custom fields are involved.
- Use `createCrud`/`updateCrud`/`deleteCrud` for submit actions and call `flash()` for success/failure messaging.

## UI Interaction

- Every dialog MUST support `Cmd/Ctrl + Enter` to submit and `Escape` to cancel.
- Default to `CrudForm` for new forms and `DataTable` for tables.
- Use `EventSelect` from `@open-mercato/ui/backend/inputs/EventSelect` for event selection.
- NEVER use `window.confirm` — use `ConfirmDialog` and `useConfirmDialog` from `@open-mercato/ui/backend/confirm-dialog`.
- For new `DataTable` columns, set `meta.truncate` and `meta.maxWidth` when you need specific truncation; rely on defaults otherwise.
- Check existing reusable components before creating new ones — see [`.ai/specs/SPEC-001-2026-01-21-ui-reusable-components.md`](../../.ai/specs/SPEC-001-2026-01-21-ui-reusable-components.md).
- For form/detail page headers and footers, use `FormHeader` and `FormFooter` from `@open-mercato/ui/backend/forms`. `FormHeader` supports `edit` (auto-used by CrudForm) and `detail` (large title, status badge, Actions dropdown). Delete/Cancel/Save are standalone buttons; additional context actions go in the `menuActions` array. See [SPEC-016](../../.ai/specs/SPEC-016-2026-02-03-form-headers-footers.md).

## DataTable Guidelines

- Use `DataTable` as the default list view.
- Extension spots: `data-table:<tableId>:columns`, `:row-actions`, `:bulk-actions`, `:filters` (in addition to `:header`/`:footer`).
- Populate `columns` with explicit renderers; set `meta.truncate`/`meta.maxWidth` where truncation is needed.
- For filters, use `FilterBar`/`FilterOverlay` with async option loaders; keep `pageSize` ≤ 100.
- Support exports using `buildCrudExportUrl` and pass `exportOptions` to `DataTable`.
- Use `RowActions` for per-row actions; navigate via `onRowClick` or action links.
- Keep table state (paging, sorting, filters, search) in component state and reload on scope changes.
- Keep `extensionTableId` stable and deterministic.
- Render injected row actions and bulk actions through `RowActions`/bulk handlers so they follow the same guard and i18n behavior as built-ins.

## CrudForm Field Injection (UMES Phase G)

- `CrudForm` automatically resolves injected field widgets from `crud-form:<entityId>:fields`; always pass a stable `entityId`.
- Keep host field/group IDs stable so injected fields can target groups deterministically across versions.
- Use injected fields for cross-module form augmentation; keep core module fields in the base form config.

## Menu Injection (UMES Phase A/B)

- Use `useInjectedMenuItems(surfaceId)` for chrome surfaces (`menu:sidebar:*`, `menu:topbar:*`).
- Merge built-in and injected items with `mergeMenuItems(builtIn, injected)` to preserve deterministic placement.
- For relative positioning, use `InjectionPosition` + `relativeTo` IDs; if `relativeTo` is missing, insertion falls back to append.
- Treat injected labels as i18n-first: prefer `labelKey` (with human fallback `label`) and `groupLabelKey`.
- Add stable attributes (`data-menu-item-id="<id>"`) when rendering merged items so integration tests can assert injected entries.
- When filtering menu items by `item.features` or route `requireFeatures`, MUST use the shared wildcard-aware matcher from `@open-mercato/shared/lib/auth/featureMatch` — `Set.has(...)`/`includes(...)` miss `module.*` grants.

## Loading, Empty, and Error States

- For list/detail data loading, use `LoadingMessage` and `ErrorMessage` from `@open-mercato/ui/backend/detail`.
- For record-backed backend detail/edit pages, treat `notFound` as a dedicated page state, separate from generic `error`.
- When a record is missing, return early with a page-level `ErrorMessage` and a clear recovery action ("Back to list"); do not render `CrudForm`, detail sections, tabs, or record actions.
- Don't use ad hoc centered `<div>` error markup when shared backend detail primitives can express the state.
- Use `TabEmptyState` when a section is empty but otherwise healthy.
- Keep loading flags local to the section; reset errors before each load.

## Flash Messages

- Use `flash(message, 'success' | 'error')` from `@open-mercato/ui/backend/FlashMessages` for user feedback after CRUD operations.
- Prefer specific translation keys; keep message copy in module locale files.
- For non-blocking errors in side effects (e.g. creating secondary records), show a flash error and let the main flow complete.

## Notifications

- Define notification types in `src/modules/<module>/notifications.ts` and client renderers in `notifications.client.ts`.
- Define reactive notification handlers in `src/modules/<module>/notifications.handlers.ts` when notifications should trigger automatic side-effects.
- Renderers live in `widgets/notifications/` and should use `useT()` for copy.
- Use shared action labels where possible (e.g. `notifications.actions.dismiss`).
- Prefer notification creation in commands or subscribers; keep UI renderers lightweight.
- For component-scoped reactions, use `useNotificationEffect(notificationType, effect)` instead of module-specific polling loops.
- When gating notification handlers by `features`, MUST use the shared wildcard-aware matcher.

## Component Reuse

- Prefer existing UI primitives and backend components from `@open-mercato/ui` before creating new ones.
- For replacement-aware hosts, expose stable handle IDs (`page:*`, `data-table:*`, `crud-form:*`, `section:*`) so overrides are deterministic.
- Reference [`.ai/specs/SPEC-001-2026-01-21-ui-reusable-components.md`](../../.ai/specs/SPEC-001-2026-01-21-ui-reusable-components.md) for the catalog.
- For dialogs and forms, keep `Cmd/Ctrl + Enter` submit / `Escape` cancel.
- Favor composable, data-first helpers (custom field helpers, CRUD helpers, filter utilities) over bespoke logic.

## Component Replacement (UMES Phase H)

- When a host surface is replacement-aware, resolve implementations via `useRegisteredComponent(handle, Fallback)` instead of hardcoded references.
- Prefer additive override modes (`wrapper`, `props`) before full `replace`; reserve `replace` for cases where compatibility is preserved.
- Keep handle IDs stable and document them when introducing new replacement-aware surfaces.

## Portal Extension

The portal extensibility system lets app modules build customer-facing pages that integrate with the shared portal shell, navigation, auth, and event bridge.

### Portal Hooks (`packages/ui/src/portal/hooks/`)

| Hook | Import | Purpose |
|------|--------|---------|
| `useCustomerAuth` | `@open-mercato/ui/portal/hooks/useCustomerAuth` | Customer auth state (user, roles, features, logout) |
| `useTenantContext` | `@open-mercato/ui/portal/hooks/useTenantContext` | Resolve tenant/org from URL slug |
| `usePortalInjectedMenuItems` | `@open-mercato/ui/portal/hooks/usePortalInjectedMenuItems` | Load feature-gated menu items for portal surfaces |
| `usePortalEventBridge` | `@open-mercato/ui/portal/hooks/usePortalEventBridge` | SSE connection for portal real-time events |
| `usePortalAppEvent` | `@open-mercato/ui/portal/hooks/usePortalAppEvent` | Listen for portal events by pattern |

### Portal Shell (`packages/ui/src/portal/PortalShell.tsx`)

Shared layout with header, nav (built-in + injected), main, footer. Supports event bridge and component replacement handles.

```tsx
import { PortalShell } from '@open-mercato/ui/portal/PortalShell'
import { useCustomerAuth } from '@open-mercato/ui/portal/hooks/useCustomerAuth'

function MyPage({ orgSlug }) {
  const { user, logout } = useCustomerAuth(orgSlug)
  return (
    <PortalShell orgSlug={orgSlug} authenticated={!!user} onLogout={logout} enableEventBridge>
      {/* page content */}
    </PortalShell>
  )
}
```

### Portal Menu Injection Spots (FROZEN)

| Spot ID | Purpose |
|---------|---------|
| `menu:portal:sidebar:main` | Main portal navigation |
| `menu:portal:sidebar:account` | Account/settings navigation |
| `menu:portal:header:actions` | Header action buttons |
| `menu:portal:user-dropdown` | User dropdown menu items |

### Portal Widget Injection Spots (FROZEN)

| Spot ID | Purpose |
|---------|---------|
| `portal:dashboard:sections` | Dashboard section cards |
| `portal:dashboard:profile` | Dashboard profile area |
| `portal:dashboard:sidebar` | Dashboard sidebar |
| `portal:<pageId>:before` | Before page content |
| `portal:<pageId>:after` | After page content |

### Portal Component Replacement Handles (FROZEN)

| Handle | Purpose |
|--------|---------|
| `page:portal:layout` | Entire portal shell |
| `section:portal:header` | Header bar |
| `section:portal:footer` | Footer |
| `section:portal:sidebar` | Navigation sidebar |
| `section:portal:user-menu` | User dropdown |

### Declarative Customer Auth in Page Metadata

```typescript
// frontend/[orgSlug]/portal/orders/page.meta.ts
export const metadata = {
  requireCustomerAuth: true,
  requireCustomerFeatures: ['portal.orders.view'],
  navHidden: true,
}
```

### Declarative Customer Role Features in setup.ts

```typescript
export const setup: ModuleSetupConfig = {
  defaultCustomerRoleFeatures: {
    buyer: ['portal.orders.view', 'portal.orders.create'],
    viewer: ['portal.orders.view'],
  },
}
```

### Portal Event Bridge

Events with `portalBroadcast: true` are streamed to authenticated portal users via `/api/customer_accounts/portal/events/stream`.

```typescript
const events = [
  { id: 'sales.order.status_changed', label: 'Order Status Changed', portalBroadcast: true },
] as const

import { usePortalAppEvent } from '@open-mercato/ui/portal/hooks/usePortalAppEvent'
usePortalAppEvent('sales.order.status_changed', (event) => { refetch() })
```
