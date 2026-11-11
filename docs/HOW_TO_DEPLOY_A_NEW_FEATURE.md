# Feature development and production release

This is the routine release path for a solo developer: one feature branch, automated PR checks, a focused staging smoke test, and a production release. Promotion is one-way: `feature → staging → master`. The detailed environment and recovery procedures remain in the [Preview and Staging Environment Runbook](./professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md).

**Merging to `master` can deploy production immediately. Production migrations are not automatic. Apply any required production migration before releasing code that depends on it.**

## Routine release

### 1. Start a focused change

1. Check [KANBAN.md](./KANBAN.md) and the newest relevant [work-log entry](./WORK_LOG.md). Move the selected item to **In progress** before implementation. Keep the active scope small.
2. Branch from current `master`, not `staging`, so unreleased work cannot slip into the release:

   ```bash
   git status --short
   git fetch origin
   git switch master
   git pull --ff-only origin master
   git switch -c feature/describe-the-feature
   ```

3. Use Node 24 and npm 11. Run `npm ci` when setting up or when dependencies changed. Develop with nonproduction credentials from [CONTRIBUTING.md](../CONTRIBUTING.md) and [README.md](../README.md#environment).

Implement the change and add focused tests for its important behavior and risks. Finish any user-facing documentation and What's New entry needed for release before opening the PR; include these in the staging and production release. Run relevant targeted checks locally; the PR's CI is the routine full quality gate. Record a meaningful increment in the work log when it occurs.

### 2. Open the staging PR and wait for CI

Push the branch and open a PR into `staging`:

```bash
git push -u origin feature/describe-the-feature
gh pr create --base staging --head feature/describe-the-feature
gh pr checks PR_NUMBER --watch
```

Review the PR diff and confirm the automated **Quality** check passes. Eligible application changes also run **E2E** against a disposable nonproduction Neon branch. Documentation-only changes can skip E2E; fork PRs cannot run the secret-backed database job. Fix failures before merging. Complete the [PR template](../.github/pull_request_template.md), keeping validation and migration notes concise. When implementation and acceptance evidence are ready, move the Kanban item to **Review**, even though release is still pending.

After the checks pass, merge the PR into `staging`. Vercel deploys that branch automatically. No separate manual `none` quality dispatch is needed for the routine path: use one only when the staged revision changed after checks or you need CI evidence for that exact revision.

### 3. Smoke-test the affected path on staging

For application changes, wait for the staging deployment and test the changed user flow with synthetic staging data. Check the relevant validation or error path and any critical neighboring behavior. Do not repeat a full application checklist for an unrelated feature.

Record a short result in the release PR or work log. If a browser or hardware check is not practical, state what remains unverified rather than treating a mock as evidence.

### 4. Release to production

Open a release PR from `staging` to `master`:

```bash
gh pr create --base master --head staging
gh pr checks PR_NUMBER --watch
```

Review the complete release diff, not just the latest feature. Resolve unintended changes before merging. Merge the approved PR using **Create a merge commit**, not squash merge. This preserves the ancestry of the reviewed `staging` tip on `master`, so the branches can continue in a one-way flow without merging `master` back into `staging`.

The release PR's checks may run the automated gates again. Use those checks as the release PR gate; do not dispatch another full quality run after merge just to repeat them. After merging, watch the Vercel Production deployment and smoke-test the affected path on `www.sscc-labels.com` using an authorized account. Avoid creating real shipment records or consuming production SSCCs for testing.

### 5. Close out

- After the production deployment and smoke test succeed, move the item from **Review** to **Accomplished** in [KANBAN.md](./KANBAN.md).
- Update the same work-log entry started during implementation with the actual merge, deployment, migration, and smoke-test evidence. If implementation is complete but the release is pending, keep the item in **Review** and say so in the entry; do not defer recording completed work until a later feature.
- Delete the short-lived feature branch after it has been merged and is no longer needed. Keep `staging` and `master`.
- Do not merge `master` back into `staging`. The release merge commit makes the released `staging` tip an ancestor of `master`; absent concurrent changes, their file trees match. GitHub may show `master` ahead by the release merge commit. That is expected and does not require another sync.
- Start the next feature branch from the updated `master` and open its PR into `staging`.

## When the feature changes the database schema

Schema changes add a few guarded steps; they do not require extra full-quality runs.

1. Update [the Drizzle schema](../src/lib/server/db/schema.js), then generate the migration against the explicitly configured nonproduction developer database:

   ```bash
   npm run db:generate
   ```

2. Review and commit the generated SQL, journal, and snapshot. Review **all pending committed migrations** because the guarded workflow applies the full pending set. Make changes compatible with the app currently deployed; use a staged expand/backfill/contract approach for destructive or incompatible changes. Never use `drizzle-kit push` on shared staging or production.
3. The staging PR's CI runs the normal checks, including eligible E2E on a disposable database. Once merged and deployed to staging, apply pending migrations to the shared staging database:

   ```bash
   gh workflow run ci.yml --ref staging \
     -f database_migration_target=staging
   ```

   Wait for the migration job to succeed, then perform the staging smoke test above. The migration dispatch skips Quality/E2E because those checks ran on the PR.

4. Before merging the release PR, apply pending migrations to production from the reviewed `staging` branch:

   ```bash
   gh workflow run ci.yml --ref staging \
     -f database_migration_target=production \
     -f confirm_production_migration=APPLY_PRODUCTION_MIGRATIONS
   ```

   Wait for the production migration job to succeed, then merge the already-reviewed release PR. The workflow validates the requested target, project identity, and production confirmation. If the migration fails or is canceled, stop and follow the [runbook's migration recovery guidance](./professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md).

5. Update the developer database only if local work needs the new schema. This is separate from releasing the feature:

   ```bash
   gh workflow run ci.yml --ref master \
     -f database_migration_target=dev
   ```

If there is no schema change, skip these migration steps.

## What CI and deployment do not do

- `npm run quality` checks formatting, lint, types, unit tests, migration-history consistency, and the production build. It does not apply migrations to shared databases or prove that a live database has the expected schema.
- CI runs automatically for pull requests and pushes to `master`; pushes to `staging` deploy through Vercel but do not start CI on their own.
- Vercel deploys `master` and `staging`; it does not wait for GitHub CI and does not apply database migrations.
- Git branches do not promote Neon database data. Staging and production migrations are applied separately to their own databases; never copy staging data into production.

For database targeting, credentials, unusual deployment failures, or recovery beyond the migration gate above, use the [Preview and Staging Environment Runbook](./professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md).
