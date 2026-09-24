# PD-02 Quality Gates

Captured: 2026-09-22 (America/Managua)

## Implemented gates

| Command                | Scope                                                                                                                                   | Local result                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `npm run format:check` | Initial Prettier adoption scope: delivery configuration, server environment validation, unit tests, and professional-delivery documents | Passed                                     |
| `npm run lint`         | JavaScript and Svelte source, tests, and repository configuration                                                                       | Passed                                     |
| `npm run check`        | Repository-wide Svelte diagnostics plus strict JavaScript checks for adopted modules                                                    | Passed with 0 Svelte errors and 0 warnings |
| `npm run test:unit`    | Deterministic business rules under `tests/unit`                                                                                         | 4 tests passed                             |
| `npm run build`        | SvelteKit Production build                                                                                                              | Passed                                     |
| `npm run quality`      | All of the above in fail-fast order                                                                                                     | Passed                                     |

Prettier adoption is deliberately staged. A trial repository-wide check identified 48 legacy files that would be rewritten. The enforced scope therefore starts with new delivery files, server configuration validation, professional-delivery documentation, and new unit tests. When a legacy file receives a substantive change, format it and add it to the enforced scope rather than creating a formatting-only repository rewrite.

Strict `checkJs` across the legacy application currently identifies 311 diagnostics in 34 files, mainly untyped function parameters, untyped Svelte state, and missing application-local type declarations. `jsconfig.check.json` starts strict checking on the Production environment gate and the GS1 identifier rules. This debt is visible and the checked scope must grow as high-risk modules are changed. Repository-wide Svelte parsing and diagnostics remain enforced from the start.

## Unit-test baseline

The first Vitest suite verifies a published GS1 check-digit example, valid SSCC generation, company-prefix length boundaries, and rejection of a modified SSCC check digit. These tests are deterministic and do not access a browser, environment secret, or database.

## Generated artifacts

`.gitignore` now excludes Playwright reports, test results, coverage, local storage, environment files, and usage reports. Some Playwright report files were already tracked and have active changes associated with the account-cleanup test work. They were left untouched here to preserve that work; removing those tracked artifacts remains the final PD-02 repository-hygiene item.

## Known warnings and exceptions

The build still reports unused imports inside Better Auth packages and local `adapter-auto` platform detection. The explicit Vercel adapter is scheduled for PD-05. ESLint's Svelte navigation-resolution rule is disabled during legacy adoption because applying it would mix a broad routing rewrite into this foundation change. The Svelte reactivity preference is disabled for ordinary local `URLSearchParams` instances that do not participate in reactive state.
