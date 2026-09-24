# Preview and Staging Environment Runbook

This runbook maintains the resource-conscious Vercel and Neon setup used by the project. It assumes Vercel Hobby and Neon Free limits and keeps production data isolated from all development and test activity.

## Permanent Resources

The production Neon project remains connected to the Vercel Production environment through the `neon-logistic-label` resource.

The non-production Neon project is not connected through the Vercel Marketplace integration. Keep exactly these long-lived branches:

| Branch      | Purpose                                                          | Data                           |
| ----------- | ---------------------------------------------------------------- | ------------------------------ |
| `main`      | Default non-production branch and explicitly selected local work | Synthetic only                 |
| `staging`   | Shared database for Vercel Preview and `staging.sscc-labels.com` | Synthetic production-like data |
| `test-base` | Clean parent for disposable CI branches                          | Minimal deterministic baseline |

GitHub Actions creates `test/ci-<run-id>-<attempt>` from `test-base` for E2E execution. The workflow sets an expiration and deletes the branch in an always-run cleanup step. A temporary branch left by an interrupted run may be deleted after confirming that its corresponding GitHub Actions job is no longer running.

Do not reconnect the non-production Neon resource to all Vercel Preview environments. That connection automatically creates a persistent `preview/<git-branch>` database branch for every Vercel preview, including dependency and documentation changes.

## Required Vercel Preview Variables

Configure these variables for **Preview**, with no Git branch restriction:

| Variable                         | Type      | Required value                                                              |
| -------------------------------- | --------- | --------------------------------------------------------------------------- |
| `LOGISTIC_LABEL_DATABASE_URL`    | Sensitive | Pooled PostgreSQL connection string for the non-production `staging` branch |
| `DATABASE_ENVIRONMENT`           | Config    | `nonproduction`                                                             |
| `LOGISTIC_LABEL_NEON_PROJECT_ID` | Config    | Non-production Neon project ID                                              |
| `EXPECTED_NEON_PROJECT_ID`       | Config    | The same non-production Neon project ID                                     |

The application refuses database initialization when the environment marker is invalid or the two project IDs differ. Never copy the production URL or production project ID into Preview.

Authentication, CAPTCHA, and storage variables remain separately scoped to Preview. `BETTER_AUTH_URL` for the stable staging branch must use `https://staging.sscc-labels.com`, and its Google OAuth client and reCAPTCHA configuration must allow that domain.

Sensitive Vercel values are intentionally unavailable through `vercel env pull`. A pulled file can confirm that the variable name exists, but its local value may be blank. Verify sensitive values through a new deployment and a non-destructive application smoke test.

## Preview Build Policy

The Vercel project uses this **Ignored Build Step** command:

```bash
case "$VERCEL_GIT_COMMIT_REF" in dependabot/*) exit 0 ;; *) exit 1 ;; esac
```

Vercel interprets exit code `0` as canceling the build and exit code `1` as continuing. Dependabot pull requests run the secret-free GitHub Quality job and skip Neon-backed E2E because GitHub does not expose ordinary Actions secrets to Dependabot. Reproduce a selected dependency update on a maintainer branch when it needs browser/database validation. Feature and fix branches continue to receive Vercel previews when a hosted review is useful.

All Vercel Preview deployments use the shared `staging` database unless a temporary database is created and assigned manually for a specific high-risk change. Do not run destructive tests or automatic schema migrations from arbitrary preview builds against shared staging.

## Staging Deployment Check

After changing a Preview variable or staging database credential:

1. Redeploy the latest deployment whose source branch is `staging`.
2. Confirm the deployment uses the intended staging commit rather than a Dependabot commit.
3. Confirm `staging.sscc-labels.com` points to the new deployment.
4. Sign in with an existing staging test account.
5. Confirm the dashboard and existing synthetic data load.
6. Sign out and confirm the user name disappears.
7. Confirm Neon did not create a new `preview/staging` branch.

Use the existing build cache unless the failure specifically indicates stale build output. A dependency-resolution error occurs before database initialization and should be investigated as a package compatibility problem.

## Schema Change Procedure

1. Generate and review the committed Drizzle migration locally.
2. Let GitHub Actions apply the migration and run E2E tests on its disposable Neon branch.
3. Promote the reviewed commit to the `staging` Git branch and wait for its Vercel deployment.
4. In GitHub, open **Actions → CI → Run workflow**, select the `staging` branch, choose `staging` as the database migration target, and run it. The guarded job uses the repository's Neon API credential to load the existing `staging` branch; it refuses to create a missing branch.
5. Redeploy if needed and smoke-test `staging.sscc-labels.com`.
6. From the same reviewed `staging` commit, run the workflow again with the `production` target and enter `APPLY_PRODUCTION_MIGRATIONS` in the confirmation field. The production GitHub project variable, exact confirmation, database environment, and Neon project identity must all agree before Drizzle connects.
7. Verify the production migration completed before merging or promoting application code that requires the new schema.

Selecting `none` runs the ordinary manually dispatched quality workflow. Database migration jobs do not run on pushes or pull requests. The existing database environment and Neon project-identity guards still apply to both targets. Never print connection strings or commit pulled environment files.

Do not let a pull-request preview apply migrations automatically to shared staging. If concurrent or incompatible schema versions must be reviewed, create one temporary Neon branch manually, use branch-specific Vercel variables, and delete the branch after the review.

## Credential Rotation

When the non-production staging database credential changes:

1. Obtain the pooled connection string for the Neon `staging` branch. Do not paste it into chat, logs, source files, or shell history.
2. Replace the sensitive Preview variable `LOGISTIC_LABEL_DATABASE_URL` in Vercel.
3. Confirm both project-ID variables still match the non-production Neon project.
4. Redeploy the `staging` Git branch and complete the staging deployment check.
5. Revoke the old Neon credential after the new deployment succeeds.

## Routine Cleanup

- Keep `main`, `staging`, and `test-base` in the non-production Neon project.
- Delete obsolete `preview/*` branches after confirming no active deployment requires them.
- Delete stale `test/ci-*` branches only after the corresponding workflow has stopped.
- Never delete the production branch while cleaning non-production resources.
- Review branch count after interrupted CI runs and before starting database-heavy maintenance.

## Failure Guide

| Symptom                                    | First check                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `LOGISTIC_LABEL_DATABASE_URL is not set`   | Preview variable exists and a deployment was created after it changed                                           |
| Database environment mismatch              | `DATABASE_ENVIRONMENT` is `nonproduction` in Preview                                                            |
| Neon project identity mismatch             | `LOGISTIC_LABEL_NEON_PROJECT_ID` equals `EXPECTED_NEON_PROJECT_ID` and both identify the non-production project |
| Invalid Better Auth origin                 | `BETTER_AUTH_URL` exactly matches the browser origin, including `https://`                                      |
| Google sign-in remains on “Opening Google” | Better Auth origin, Google authorized origin, callback URI, and deployment protection                           |
| `npm ERESOLVE` during install              | Deployment source commit and dependency peer ranges; this occurs before any database connection                 |
| Neon branch limit reached                  | Stale `preview/*` or interrupted `test/ci-*` branches; do not delete the three permanent branches               |
