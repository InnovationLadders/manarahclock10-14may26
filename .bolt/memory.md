# Project memory

## Product intent & audience

- Digital mosque display application (شاشات المساجد) — background images, likely prayer times and related content.
- Primary users: mosque admins who upload/manage backgrounds; display screens run unattended in mosques.
- Offline resilience is critical: screens must keep showing backgrounds during internet outages.

## Brand personality & voice

- Communication in Arabic; user-facing messages should remain Arabic.
- Helpful, practical, diagnostic tone when reporting issues/plans.

## Visual design & UX direction

- Supports both portrait (عمودية) and landscape (أفقية) display orientations; default backgrounds exist for each.
- Background card UI in settings; empty/broken cards currently shown as failure state.

## Decisions, constraints & rationale

- Backend: Firebase Storage currently used for background uploads; Supabase available as alternative (unconfirmed migration).
- Local caching strategy (current, buggy): saves a local copy only after successful online load — fails if internet drops before save completes.
- Workaround attempted: two default backgrounds applied to all mosques for stable display with/without internet — not fully implemented.
- Background identity keyed by filename only; stale local copies persist when image content changes.

## Open questions & assumptions

- Keep Firebase Storage or migrate backgrounds to Supabase?
- Display environment: fixed browser or installed app? Required offline duration?
- Max upload size to optimize for weak devices (e.g., 5 MB)?
- Do old background URLs still resolve, or were they deleted/expired?
- Storage permissions — are upload rules correctly configured for mosque accounts?
- Are default backgrounds registered for PWA/offline precaching so they load without internet?