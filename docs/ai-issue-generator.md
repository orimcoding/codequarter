# AI Issue Generator

This repository includes a GitHub Actions workflow that can create GitHub issues automatically.

## Workflow

File: `.github/workflows/issue-generator.yml`

It can run:

- manually with `workflow_dispatch`
- automatically on pushes to the `ci` branch for selected paths

## Modes

### Hosted mode

If `OPENAI_API_KEY` is configured, the workflow uses OpenAI to generate issue payloads.

Recommended variables:

- secret: `OPENAI_API_KEY`
- variable: `OPENAI_MODEL` default `gpt-4.1-mini`
- variable: `ISSUE_GENERATOR_TITLE_PREFIX`
- variable: `ISSUE_GENERATOR_MAX_ISSUES`

### Fallback mode

If `OPENAI_API_KEY` is not configured, the workflow falls back to rules-based issue generation.

## What it does

The workflow inspects lightweight repository signals such as:

- presence of contributor docs
- package scripts
- workflow coverage
- whether `src/` has been scaffolded

It then writes issue payloads and opens GitHub issues using the repository token.

## Required GitHub configuration

### Repository secrets

- `OPENAI_API_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Repository variables

- `OPENAI_MODEL`
- `ISSUE_GENERATOR_TITLE_PREFIX`
- `ISSUE_GENERATOR_MAX_ISSUES`

## Notes

- duplicate open issues are skipped by title
- hosted generation is best for richer issue descriptions
- fallback generation keeps the workflow usable without model access
