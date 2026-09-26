# Owner Statistics Runbook

Use this runbook to configure and verify the private `/admin/statistics` page. Account IDs and database results are operational secrets; do not commit them or copy them into usage reports.

## Environment Mapping

Configure each deployment against the user IDs stored in that deployment's database. IDs can differ even when the same email address exists in both databases.

| Deployment                | Database                          | Vercel scope                                              |
| ------------------------- | --------------------------------- | --------------------------------------------------------- |
| `staging.sscc-labels.com` | Nonproduction Neon staging branch | Preview, using the `staging` branch override when present |
| `sscc-labels.com`         | Production Neon project           | Production                                                |

## Find the Account IDs

1. Open the Neon SQL Editor for the intended environment and confirm the project and branch before querying.
2. Look up each confirmed owner or manual test account with a parameter or a locally substituted email:

   ```sql
   SELECT id
   FROM "user"
   WHERE lower(email) = lower('<account-email>');
   ```

3. Keep the returned IDs in the Neon/Vercel configuration workflow. Do not add them to tracked files, screenshots, tickets, or chat.

## Configure Vercel

Create these server-only variables independently in Preview and Production:

- `ANALYTICS_OWNER_USER_IDS`: comma-separated IDs allowed to open the page.
- `ANALYTICS_EXCLUDED_USER_IDS`: comma-separated IDs for confirmed manual test accounts.

Use Vercel's **Secret** type. Owner IDs are automatically excluded from every dashboard query and do not need to be repeated in the second variable. Redeploy the relevant commit after changing either value because an existing deployment keeps its previous environment snapshot.

## Verify a Release

1. Sign in to the target deployment with the configured owner account.
2. Confirm **Statistics** appears in desktop and mobile navigation.
3. Open `/admin/statistics` and verify both 7-day and 30-day views load.
4. Confirm the exclusion count matches the distinct IDs across both variables.
5. Confirm the page contains aggregate counts and controlled failure categories only; it must not show emails, names, company data, label identifiers, or raw errors.
6. Sign in with a normal account and confirm a direct request to `/admin/statistics` returns `403`.
7. Compare signup and saved-label totals with aggregate SQL for the same rolling interval before using the report for a product decision.

## Maintenance

Update the variables and redeploy when an owner or test account is deleted or recreated. Review the list before each dated usage report. Removing an ID changes future event classification and dashboard query exclusions; it does not rewrite an existing event's `is_internal` value.
