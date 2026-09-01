# Security

## Pull-request security gate

The `Security` GitHub Actions workflow runs for every pull request targeting `main`.

It performs:

- A filesystem vulnerability scan
- Secret detection
- Infrastructure and configuration scanning
- Dependency-change review for high and critical vulnerabilities

The repository scan also runs after changes reach `main`, every Monday, and when manually requested.

## Required GitHub ruleset

The workflow cannot prevent direct pushes by itself. Configure a branch ruleset for `main` in **Settings → Rules → Rulesets** with:

1. Require a pull request before merging.
2. Require status checks to pass.
3. Add `Repository scan` as a required check.
4. Add `Dependency review` as a required check.
5. Require branches to be up to date before merging.
6. Block force pushes and branch deletion.
7. Do not allow bypasses except for a documented emergency administrator process.

These settings ensure security checks run before a change can be merged into `main`.

## Application scanning

When application code is introduced, extend the pipeline with:

- Unit, integration, and end-to-end tests
- Type checking and linting
- Production build verification
- CodeQL static analysis for the selected application languages
- Database migration validation

Security tests for authorization, private profile fields, invitations, and member-management boundaries are defined in the product blueprint.

## Sensitive chapter data

Do not commit the legacy roster, extracted member information, production exports, credentials, invitation tokens, or private profile media. Use synthetic records in automated tests.
