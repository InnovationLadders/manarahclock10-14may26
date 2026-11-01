# Project memory

## Product intent & audience

- Digital mosque display application (شاشات المساجد) — background images, prayer times, and related content.
- Primary users: mosque admins who upload/manage backgrounds; display screens run unattended in mosques.
- Super-admin panel manages all mosque accounts: list, edit, delete mosque records and associated settings.
- Offline resilience is critical: screens must keep showing backgrounds during internet outages.

## Brand personality & voice

- Communication in Arabic; user-facing messages should remain Arabic.
- Helpful, practical, diagnostic tone when reporting issues/plans.

## Visual design & UX direction

- Supports both portrait (عمودية) and landscape (أفقية) display orientations; default backgrounds exist for each.
- Background card UI in settings; empty/broken cards currently shown as failure state.
- Mosque account cards in admin panel show name, email, city, creation date.
- Admin UI used on both phone and computer — responsive layout required.
- Edit/Delete buttons per mosque card; confirmation dialog naming the mosque before deletion.

## Decisions, constraints & rationale

- Backend: Firebase Storage for background uploads; Supabase available as alternative (unconfirmed migration). Mosque data stored in Firebase currently.
- Admin-only permissions enforced at database rule level for edit/delete actions.
- Changing mosque login (email/password) requires secure server-side step — cannot be done client-side.
- Deleting a mosque removes record, display settings, uploaded backgrounds, and revokes login access.
- Local caching strategy (current, buggy): saves local copy only after successful online load — fails if internet drops before save completes.
- Workaround attempted: two default backgrounds for stable display with/without internet — not fully implemented.
- Background identity keyed by filename only; stale local copies persist when image content changes.

## Open questions & assumptions

- Keep Firebase or migrate mosque data/backgrounds to Supabase? (applies to both storage and auth)
- Which mosque settings should admin edit: name/location only, or also login email, password, display settings (madhab, backgrounds)?
- On deletion: remove immediately or archive for restoration?
- Display environment: fixed browser or installed app? Required offline duration?
- Max upload size to optimize for weak devices (e.g., 5 MB)?
- Do old background URLs still resolve, or were they deleted/expired?
- Storage permissions — are upload rules correctly configured for mosque accounts?
- Are default backgrounds registered for PWA/offline precaching so they load without internet?