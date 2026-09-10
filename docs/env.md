# Environment Setup

Use `.env.example` as the template for local development.

## Local `.env.local`

Create a `.env.local` file with values like:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ISSUE_GENERATOR_TITLE_PREFIX`
- `ISSUE_GENERATOR_MAX_ISSUES`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## GitHub Actions

For workflows, configure these in GitHub:

### Secrets

- `OPENAI_API_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Variables

- `OPENAI_MODEL`
- `ISSUE_GENERATOR_TITLE_PREFIX`
- `ISSUE_GENERATOR_MAX_ISSUES`

## Vercel

You can get these from your Vercel account and project settings:

- token from account settings
- org id from Vercel project linking or CLI metadata
- project id from the linked Vercel project

## OpenAI

Use an API key with access to the model you choose in `OPENAI_MODEL`.
