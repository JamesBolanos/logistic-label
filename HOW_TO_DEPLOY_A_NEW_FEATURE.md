# How to deploy a new feature

This guide describes the repository's current release process: develop on a short-lived branch, verify the feature on staging, apply any production migrations, and then release application code through `master`.

**Pushing or merging into `master` can deploy production immediately. It does not apply production database migrations. Finish the production migration step before merging code that requires it.**

The developer runs the Git, GitHub, migration, and deployment actions below. Run commands from the repository root. Replace example branch names and placeholders such as `PR_NUMBER` and `RUN_ID` before running them. GitHub CLI examples require an installed, authenticated `gh`; the equivalent GitHub UI actions are described alongside them.

## 1. Understand the environments and automation

| Environment             | Git source                                        | Application                                                                    | Database                                                       |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Local development       | Short-lived feature/fix branch                    | Local development server                                                       | Explicitly selected nonproduction database                     |
| CI E2E                  | Eligible PR, `master` push, or manual quality run | Local server inside GitHub Actions                                             | Disposable `test/ci-*` branch from nonproduction `test-base`   |
| Staging / preproduction | `staging`                                         | Vercel Preview at `https://staging.sscc-labels.com`                            | Persistent `staging` branch in the nonproduction Neon project  |
| Production              | `master`                                          | Vercel Production at `https://www.sscc-labels.com` / `https://sscc-labels.com` | Existing `main` branch in the separate production Neon project |

A Git branch and a Neon database branch are different resources. Promoting Git code does not merge database branches or copy staging records into production. The same committed migrations are applied separately to each database.

| Action                                                | What happens automatically                                | What does not happen                                                          |
| ----------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Open/update a PR                                      | GitHub Quality and eligible isolated E2E                  | No automatic feature-branch Vercel deployment; no shared-database migration   |
| Push/merge to `staging`                               | Vercel staging deployment                                 | No GitHub CI run from that push alone; no staging migration                   |
| Push/merge to `master`                                | Vercel production deployment and GitHub CI, independently | No production migration; no repository-enforced wait for migration completion |
| Manually run CI with migration target `none`          | Quality and eligible E2E                                  | No shared staging/production migration                                        |
| Manually run CI with target `staging` or `production` | The guarded migration job                                 | Quality and E2E are skipped                                                   |

`npm run quality` includes `db:check`, which validates committed migration history. It does not compare the live production schema or apply migrations. E2E migrations only update their disposable database. A green CI run or Vercel build is therefore not proof that production has the required columns.

Sources: [CI workflow](.github/workflows/ci.yml), [npm scripts](package.json), [Vercel branch policy](vercel.json), and [environment runbook](docs/professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md). Vercel is the supported deployment target; Cloudflare status is not an acceptance signal. Dashboard settings and credentials must still be checked in their respective services.

## 2. Define the work and prepare a branch

1. Read [KANBAN.md](docs/KANBAN.md) and the newest relevant [work-log entry](docs/WORK_LOG.md).
2. Select or create an item with a stable ID, need, outcome, acceptance evidence, and dependencies. Move it into **Work in Progress** before implementation. Keep only one item across Work in Progress and Review; complete, block, or return the previous item to Ready first.
3. Start with a clean working tree and current `master`. Do not discard unrelated local changes.

```bash
git status --short
git fetch origin
git switch master
git pull --ff-only origin master
git switch -c feature/describe-the-feature
```

Use Node 24 and npm 11, as recorded in [.nvmrc](.nvmrc) and [package.json](package.json). If nvm is installed:

```bash
nvm use
npm ci
```

Configure development-only variables using [CONTRIBUTING.md](CONTRIBUTING.md) and [README.md](README.md#environment). Never point routine development, tests, or seeds at production.

## 3. Implement, document, and validate

Implement the acceptance criteria and run focused checks appropriate to the changed risk. Before preparing the final PR, update the documents listed in section 9 and run `npm run quality` once on the final change.

### If the feature changes the schema

1. Edit [schema.js](src/lib/server/db/schema.js).
2. With the local database configuration explicitly targeting nonproduction, generate the migration:

   ```bash
   npm run db:generate
   ```

3. Review the generated SQL, `drizzle/meta/_journal.json`, and snapshot together. Commit them with the application change. Do not rewrite previously applied migrations or use `drizzle-kit push` against shared staging or production.
4. Make the migration compatible with the application version still running in production. Prefer adding structures first, then deploying the new code; do backfills and removals in separately reviewed releases when needed. A rename, drop, or new constraint may require a staged rollout rather than this simple sequence.
5. Review expected locks, data changes, and a recovery approach. For higher-risk migrations, test against the previous released schema using isolated synthetic fixtures. The current E2E job starts from `test-base`; its success alone does not establish both fresh-database and previous-release upgrade coverage.

The migration workflow applies **all pending committed migrations**, not a selected SQL filename. Review the entire pending set. If there is no schema change, mark migrations **not applicable** and skip the migration commands in sections 5 and 6.

### Final local check and PR

```bash
npm run quality
git diff --check
git diff
```

Commit only the intended files, including the relevant documentation and migrations. Avoid staging local environment files or private reports. Push the feature branch:

```bash
git push -u origin feature/describe-the-feature
```

For the staging-first path in this guide, open a PR from the feature branch into `staging`:

```bash
gh pr create --base staging --head feature/describe-the-feature
```

Complete the [PR template](.github/pull_request_template.md): purpose, Kanban ID, risk, validation, migrations, recovery, and user-facing release note or “not applicable.” Move the item to **Review** when its acceptance evidence is ready; a green local build alone is not a release.

Inspect the full PR diff and wait for its checks:

```bash
gh pr checks PR_NUMBER --watch
```

Confirm Quality and the E2E coverage needed by the change actually ran. Documentation-only and Dependabot changes can skip E2E; fork PRs do not get the secret-backed database job. The current documentation-only scope check examines the most recent commit diff, so an earlier application change followed by a docs commit can also be missed. Use the manual staging quality run below when exact staged-revision coverage is needed.

## 4. Deploy and verify the staging revision

1. Confirm `staging` contains no unrelated unreleased work. Review the complete proposed release, not just the latest feature diff. If staging has other changes, reconcile or explicitly include and review them before proceeding; do not force-reset a shared branch.
2. Merge the reviewed feature PR into `staging` using GitHub. This starts the staging Vercel deployment.
3. Open that Vercel deployment and record its source commit SHA and URL in the PR. Verify `staging.sscc-labels.com` points to it and that its environment is Preview.
4. For an application feature, run Quality/E2E on that exact staged revision. A push to `staging` does not run GitHub CI by itself:

   ```bash
   gh workflow run ci.yml --ref staging \
     -f database_migration_target=none
   ```

5. Find the run and confirm its commit SHA matches the staged deployment:

   ```bash
   gh run list --workflow ci.yml --branch staging \
     --event workflow_dispatch --limit 5 \
     --json databaseId,headSha,status,conclusion,url
   gh run watch RUN_ID --exit-status
   ```

You can also use **GitHub → Actions → CI → Run workflow**, choose branch `staging`, and select target `none`. Wait for this run to finish before dispatching a migration.

Keep `staging` unchanged throughout validation and migration. Workflow dispatch resolves the current branch tip; it is not pinned to the SHA you recorded earlier. Check the resulting run's SHA. A changed branch requires reviewing and validating the new revision.

**Concurrency limitation:** CI uses a branch-based concurrency group with `cancel-in-progress: true`. Another dispatch or triggering event in the same group can cancel a migration. Run these steps sequentially, avoid overlapping workflows on that branch, and do not assume a canceled migration left the database unchanged.

## 5. Apply staging migrations and smoke-test

Skip the migration action if there are no pending schema changes.

In GitHub Actions settings, confirm the nonproduction variable `NEON_NONPRODUCTION_PROJECT_ID` and secret `NEON_API_KEY` are configured. Preview must use the nonproduction staging database; see the [Preview variable contract](docs/professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md#required-vercel-preview-variables).

Run the existing staging migration job:

```bash
gh workflow run ci.yml --ref staging \
  -f database_migration_target=staging
```

UI equivalent: **Actions → CI → Run workflow → branch `staging` → target `staging`**. Production confirmation is not needed. This job accepts only the `staging` Git branch and targets the existing nonproduction Neon branch named `staging`.

Use the run-list/watch commands from section 4 to identify the new run and wait for **Migrate staging database → Apply committed migrations** to succeed. Quality/E2E being skipped in this migration run is expected; their evidence must come from the preceding check run.

Because the staging push deploys automatically before this manual migration, schema-dependent pages may temporarily fail. Do not use that interval as acceptance evidence. After migration, reload the app; redeploy staging if a failed build or changed environment variables require it. Verify the source SHA again.

Smoke-test with synthetic staging data:

- Home, login, guide, and updates pages load as relevant.
- Sign-in, redirects, and logout work; test Google OAuth/CAPTCHA when affected.
- Dashboard, settings, and existing saved labels load for the test account.
- The new feature works, including its important validation/error paths.
- PDF/ZPL downloads still reuse existing labels and SSCCs when those paths are affected.
- Schema-dependent requests succeed; inspect relevant Vercel runtime errors.
- Complete any feature-specific hardware checks, or explicitly record what remains unverified. A browser mock or bridge connection check is not proof of physical printing.

Record the staged SHA, check/migration run links, smoke outcome, and material limitations in the release PR. Keep credentials, personal data, labels, and raw private logs out of tracked documentation.

## 6. Prepare the production release and migrate first

Open a release PR from `staging` into `master`:

```bash
gh pr create --base master --head staging
```

**Do not merge it yet.** Review the complete diff against current `master`, link staging evidence, and wait for the relevant PR checks. Do not enable auto-merge before the production migration gate is complete.

If `master` advanced since staging was tested, incorporate those changes into staging, resolve any conflicts, and repeat affected validation before migration. A squash merge will produce a different commit SHA; what must remain reviewed is the resulting application content and exact migration set. Do not introduce untested changes during promotion.

Before production migration:

- Verify GitHub Actions variable `NEON_PRODUCTION_PROJECT_ID` and secret `NEON_PRODUCTION_API_KEY` refer to the intended production project.
- Confirm the workflow's existing Neon `main` branch and database match Vercel Production's connection. The workflow does not explicitly set `database_name` on the Neon action; check that the action's selected database is the application's database, especially if the branch contains multiple databases.
- Check production migration history and compare it with the committed journal. If history is missing or inconsistent, investigate before migration.
- Confirm the migration is compatible with the currently deployed app and that an appropriate backup/recovery point is available. Do not assume a retention window or tested restore exists.
- Confirm the migration set and staged revision have not changed since review.

For schema changes, run production migration **from the reviewed `staging` branch before merging to `master`**:

```bash
gh workflow run ci.yml --ref staging \
  -f database_migration_target=production \
  -f confirm_production_migration=APPLY_PRODUCTION_MIGRATIONS
```

UI equivalent: **Actions → CI → Run workflow → branch `staging` → target `production` → confirmation `APPLY_PRODUCTION_MIGRATIONS`**.

Find this run using the staging run-list command, verify its SHA, and wait for **Migrate production database → Apply committed migrations** to succeed. The workflow resolves the production connection and supplies the environment guards to `npm run db:migrate`; do not substitute a local command relying on whichever `.env` happens to be loaded.

In the SQL editor for the intended production database, this read-only query shows the migration ledger:

```sql
SELECT id, created_at
FROM drizzle.__drizzle_migrations
ORDER BY created_at DESC;
```

Compare `created_at` values with `when` values in [drizzle/meta/_journal.json](drizzle/meta/_journal.json), and verify the changed tables/columns or constraints. A missing ledger is an investigation trigger, not permission to recreate all existing tables. Record the result, not database credentials or customer records.

**If migration fails or is canceled, stop the release.** Inspect the failed step, ledger, and actual schema before choosing retry or forward recovery. Do not manually mark a migration applied, delete ledger rows, or rerun individual SQL files to make the job appear successful.

## 7. Release application code to production

Once staging is accepted, checks pass, and production migration is successful or explicitly not applicable:

1. Recheck the release PR's current head and diff. If the staged revision changed, repeat the relevant gates before merging.
2. Squash-merge the release PR into `master` through GitHub. **Keep the persistent `staging` branch**; do not select a delete-branch action for it.
3. Vercel's Git integration builds and deploys `master`. GitHub CI runs separately. Observe both; do not assume Vercel waited for CI.
4. Confirm Vercel Production's source SHA is the new `master` commit and its production domains point to that deployment.
5. Run a small production smoke check with an authorized existing account: sign-in/logout, settings/dashboard, the affected feature, and existing-label downloads as appropriate. Avoid generating shipment records or consuming real SSCCs just to test deployment. Use staging for synthetic write-heavy tests.
6. Review relevant runtime errors and verify the expected What's New entry and public guidance are visible.

Record the production commit, deployment link, migration result/run link, smoke outcome, and any remaining limitations. If production is unhealthy, follow section 10 instead of marking the feature released successfully.

For documentation-only or routine low-risk internal changes, [the project policy](CONTRIBUTING.md#checks) allows PR checks without hosted staging or E2E. Record those steps as not applicable. This exception does not waive staging verification for a feature that changes application behavior or shared schema.

## 8. Close out and synchronize branches

After the merge/release evidence required by the Kanban item is satisfied:

- Move the item from Review to **Accomplished** in [KANBAN.md](docs/KANBAN.md). Keep unresolved hardware or operational follow-ups explicit.
- Finish the concise work-log entry with the actual validation/release outcome. If evidence is only developer-reported, say so.
- Put post-release documentation updates through a small follow-up PR if the release PR is already merged; never claim a future deployment has succeeded in advance.
- Delete the merged short-lived feature branch when no longer needed. Keep `staging` and the persistent nonproduction database branches.
- After a squash release and any closeout PR, bring current `master` back into `staging` so the next release starts from current production history.

For a repository that permits direct staging updates, with a clean working tree:

```bash
git fetch origin
git switch staging
git pull --ff-only origin staging
git merge --no-edit origin/master
git push origin staging
```

If branch protection requires a PR, use a `master` → `staging` synchronization PR instead. Resolve conflicts deliberately; do not force-push/reset to bypass them. This staging update can trigger Vercel again. If staging has no unreleased work, compare the final trees:

```bash
git fetch origin
git diff --exit-code origin/master origin/staging
```

No differences means the file contents match; the branch histories and SHAs can still differ. Investigate unexpected differences before starting another release.

## 9. Documentation to update

| File or record                                                                                        | When and what to update                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/KANBAN.md](docs/KANBAN.md)                                                                      | Before work: ID, scope, acceptance, dependencies, and Work in Progress. At review: evidence. After successful required merge/release: Accomplished and actual release evidence. This is the only current status source.                                                                                                                                                                       |
| [docs/WORK_LOG.md](docs/WORK_LOG.md)                                                                  | One concise dated entry per meaningful increment: decisions, material files/migrations, validation, limitations, and next action. Update the relevant increment with its release result when appropriate.                                                                                                                                                                                     |
| [PR description](.github/pull_request_template.md)                                                    | Problem/result, risk, checks, migration applicability, staged/deployed revision, run/deployment links, recovery, and release note. Link staging evidence from the production PR.                                                                                                                                                                                                              |
| [src/lib/content/releases.ts](src/lib/content/releases.ts)                                            | User-visible feature/fix: unique ID, release date, category, benefit, feature key, and working destination link. Prepare the final entry before staging acceptance; ship `status: 'published'` with the production feature. Draft entries are hidden. Publishing an entry does not deploy the app; future dates are not a scheduling gate. Internal/docs-only changes normally need no entry. |
| [Public guide](src/routes/guide/+page.svelte) and affected UI help                                    | Update when user instructions, supported workflows, output, or setup change. Verify links and examples on staging.                                                                                                                                                                                                                                                                            |
| Relevant `docs/labels/`, `docs/auth/`, `docs/analytics/`, or `docs/professional-delivery/` reference  | Update the behavior, setup, operations, or validation changed by the feature. Keep current queue/status in Kanban.                                                                                                                                                                                                                                                                            |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                                                          | Update when a durable system boundary, data flow, or architectural constraint changes.                                                                                                                                                                                                                                                                                                        |
| [README.md](README.md), [.env.example](.env.example), [CONTRIBUTING.md](CONTRIBUTING.md)              | Update when setup, environment-variable contracts, toolchain, or contributor workflow changes. Examples contain placeholders, never real credentials.                                                                                                                                                                                                                                         |
| This guide and [environment runbook](docs/professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md) | Update together when triggers, branch policy, migration guards, environment targeting, or release order changes.                                                                                                                                                                                                                                                                              |

Do not copy status into older plans. Consult detailed plans only for the selected item's requirements. Do not put secrets, production records, raw labels, or private usage reports in Git, PR descriptions, or release evidence.

## 10. Recovery and common mistakes

| Situation                                          | Action                                                                                                                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New production code, missing schema                | Confirm the deployed revision and target database, inspect the ledger/schema, and use the guarded production workflow from `master` only if its current migration set is the reviewed deployed set. Command below. |
| Migration succeeded, application deployment failed | Compatible additive changes can usually remain while you fix the build or retain the previous app. Do not automatically undo the database migration.                                                               |
| Migration failed or was canceled                   | Stop promotion; inspect the failed step and actual database state. Determine whether retry is safe before starting another run.                                                                                    |
| Production app is unhealthy after release          | Restore a known compatible application deployment through Vercel or ship a reviewed fix. Confirm that the previous app supports the current schema. Application rollback does not undo database changes.           |
| Data was changed incorrectly                       | Assess the affected writes and recovery point before any restore. Database restore can discard legitimate writes since that point; follow a reviewed recovery plan.                                                |
| Staging push has no GitHub CI run                  | Expected: push CI is configured only for `master`. Use a PR or a manual `none` run on staging.                                                                                                                     |
| Migration run shows Quality/E2E skipped            | Expected for a migration dispatch. Verify a separate successful check run for the reviewed content.                                                                                                                |
| Missing variable/API key or environment mismatch   | Correct the service configuration and confirm the selected project/branch/database. Do not bypass guards or paste credentials into logs.                                                                           |

Recovery command for an already deployed, reviewed `master` migration set:

```bash
gh workflow run ci.yml --ref master \
  -f database_migration_target=production \
  -f confirm_production_migration=APPLY_PRODUCTION_MIGRATIONS
```

This is a production write, not a diagnostic command. Prefer the normal pre-release `--ref staging` path. Neither route requires manually executing numbered SQL files.

## Release checklist

- [ ] Kanban item and acceptance criteria are defined; required documentation is updated.
- [ ] Final local quality and relevant PR checks passed.
- [ ] Staging contains only the reviewed release; its revision and smoke evidence are recorded, or staging is explicitly not applicable for this change.
- [ ] Pending migration set was reviewed and tested; staging migration succeeded, or no migration is needed.
- [ ] Production target and recovery approach are verified; production migration succeeded **before** merging dependent code to `master`, or is not applicable.
- [ ] Production PR has no unreviewed changes and is merged; persistent staging branch is retained.
- [ ] Vercel production revision, affected user paths, runtime errors, and public release note are checked.
- [ ] Kanban/work-log closeout records actual evidence and limitations; staging is synchronized for the next feature.

## Command references

- [Git branch switching](https://git-scm.com/docs/git-switch), [merging](https://git-scm.com/docs/git-merge), and [diff](https://git-scm.com/docs/git-diff).
- [GitHub PR creation](https://cli.github.com/manual/gh_pr_create), [PR checks](https://cli.github.com/manual/gh_pr_checks), [workflow dispatch](https://cli.github.com/manual/gh_workflow_run), and [run watching](https://cli.github.com/manual/gh_run_watch).
- [Drizzle migration application](https://orm.drizzle.team/docs/drizzle-kit-migrate).
