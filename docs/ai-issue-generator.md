# AI Issue Generator

This repository includes a GitHub Actions workflow that can create GitHub issues automatically.

## Workflow

File: `.github/workflows/issue-generator.yml`

It can run:

- manually with `workflow_dispatch`
- automatically on pushes to the `ci` branch for selected paths

## What it does

The workflow inspects lightweight repository signals such as:

- presence of contributor docs
- package scripts
- workflow coverage
- whether `src/` has been scaffolded

It then writes issue payloads and opens GitHub issues using the repository token.

## Notes

- this is rules-based automation, not a hosted LLM
- it is still CI/CD-adjacent because it runs in GitHub Actions and automates repo maintenance
- duplicate open issues are skipped by title

## Inputs

- `title_prefix`: prefix for generated issue titles
- `max_issues`: maximum number of issues to create

## Permissions

The workflow requires:

- `contents: read`
- `issues: write`

## Future upgrade path

Later, this can be upgraded to use an external model provider or GitHub-hosted AI tooling to generate richer issue content.
