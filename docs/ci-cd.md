# CI/CD

This repository uses GitHub Actions for pull request validation and optional preview deployments.

## Branch strategy

- `main`: stable branch
- `ci`: branch for CI/CD workflow changes
- `preview` or `staging`: optional deployment branches for preview environments

## Pull request checks

The `CI` workflow runs on pull requests and pushes to `main`, `develop`, and `ci`.

It validates:

- linting
- type checking
- production build

## Preview deployments

The `Deploy Preview Branch` workflow runs on pushes to `preview`, `staging`, and `ci`.

If these repository secrets are configured, it will deploy a Vercel preview build:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

If the secrets are not present, the workflow still verifies that the app builds successfully and then skips deployment.

## Recommended setup

1. Create a dedicated branch such as `ci` for workflow changes.
2. Open a pull request from `ci` into `main`.
3. Add branch protection on `main` requiring the `CI` workflow to pass.
4. Optionally connect the repo to Vercel and add the required secrets for preview deploys.
