## Purpose

Describe the problem, the resulting behavior, and any user-visible change.

## Risk and validation

- Risk level: low / medium / high
- Main failure modes:
- Checks run and results:
- Vercel preview reviewed: yes / no / not applicable

## Delivery checklist

- [ ] `npm run quality` passes.
- [ ] Authentication, authorization, SSCC, barcode/PDF, or data-ownership risks have focused tests when affected.
- [ ] No secret, production data, generated report, or local environment file is included.
- [ ] Schema changes include reviewed Drizzle schema, migration SQL, and snapshot files.
- [ ] The migration is backward-compatible or its expand-and-contract sequence is documented.
- [ ] New operational behavior has useful logging or an explicit observability follow-up.
- [ ] Rollback or forward-recovery steps are understood for medium/high-risk changes.
- [ ] A user-facing release note is included below, or marked not applicable.

## Release note

Not applicable, or write the short entry intended for What's New.
