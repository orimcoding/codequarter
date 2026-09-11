import fs from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';

const root = process.cwd();
const envLocalPath = path.join(root, '.env.local');

if (fs.existsSync(envLocalPath)) {
  const envLines = fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/);
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const maxIssues = Number.parseInt(process.env.MAX_ISSUES || process.env.ISSUE_GENERATOR_MAX_ISSUES || '5', 10);
const titlePrefix = process.env.TITLE_PREFIX || process.env.ISSUE_GENERATOR_TITLE_PREFIX || 'ai';
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const openAiApiKey = process.env.OPENAI_API_KEY;

function readIfExists(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return '';
  return fs.readFileSync(fullPath, 'utf8');
}

function readMany(relativePaths, maxCharsPerFile = 8000) {
  return relativePaths
    .map((relativePath) => ({
      path: relativePath,
      content: readIfExists(relativePath).slice(0, maxCharsPerFile),
    }))
    .filter((entry) => entry.content);
}

function listFiles(relativeDir) {
  const fullDir = path.join(root, relativeDir);
  if (!fs.existsSync(fullDir)) return [];

  const results = [];
  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const fullPath = path.join(fullDir, entry.name);
    const relPath = path.relative(root, fullPath);
    if (entry.isDirectory()) {
      results.push(...listFiles(relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

function buildFallbackIssues({ readme, packageJson, workflowFiles, srcFiles }) {
  const issues = [];

  if (!readme.toLowerCase().includes('contributing')) {
    issues.push({
      title: `[${titlePrefix}] add contributing guide`,
      body: [
        '## Summary',
        'Add a `CONTRIBUTING.md` file describing local setup, branch flow, PR expectations, and release/deploy notes.',
        '',
        '## Why',
        'The repository has a project overview but no dedicated contributor workflow document.',
        '',
        '## Suggested acceptance criteria',
        '- Add `CONTRIBUTING.md`',
        '- Document install, lint, typecheck, and build commands',
        '- Document CI/CD branch strategy',
      ].join('\n'),
      labels: ['documentation', 'ai-generated'],
    });
  }

  if (!packageJson.includes('test')) {
    issues.push({
      title: `[${titlePrefix}] add test runner foundation`,
      body: [
        '## Summary',
        'Set up a basic test runner and add a minimal smoke test so pull requests can validate behavior beyond lint/build.',
        '',
        '## Why',
        'The current package scripts do not include a test command.',
        '',
        '## Suggested acceptance criteria',
        '- Add a test framework',
        '- Add `npm test` script',
        '- Add at least one smoke test',
      ].join('\n'),
      labels: ['testing', 'ai-generated'],
    });
  }

  if (workflowFiles.length < 3) {
    issues.push({
      title: `[${titlePrefix}] expand workflow coverage`,
      body: [
        '## Summary',
        'Add more workflow coverage for release hygiene such as dependency review, code scanning, or scheduled maintenance checks.',
        '',
        '## Why',
        'The repository has limited workflow coverage and could benefit from additional automation.',
        '',
        '## Suggested acceptance criteria',
        '- Add at least one additional GitHub Actions workflow',
        '- Document what it protects against',
      ].join('\n'),
      labels: ['ci', 'ai-generated'],
    });
  }

  if (srcFiles.length === 0) {
    issues.push({
      title: `[${titlePrefix}] scaffold initial application structure`,
      body: [
        '## Summary',
        'Create the initial application structure for the CodeQuarter web app.',
        '',
        '## Why',
        'The repository currently has little or no source code under `src/`.',
        '',
        '## Suggested acceptance criteria',
        '- Add initial app routes',
        '- Add shared components and types',
        '- Ensure CI passes',
      ].join('\n'),
      labels: ['enhancement', 'ai-generated'],
    });
  }

  return issues;
}

async function buildHostedIssues(context) {
  if (!openAiApiKey) {
    return null;
  }

  const client = new OpenAI({ apiKey: openAiApiKey });
  const prompt = [
    'You are a senior product and engineering lead generating a practical GitHub backlog for a software repository.',
    'Return strict JSON only.',
    'Return an array of issue objects with this exact shape:',
    '[{"title":"string","body":"markdown string","labels":["label"]}]',
    `Generate at most ${maxIssues} issues.`,
    `Prefix every title with [${titlePrefix}].`,
    'Generate the most important missing issues needed to turn this repository into a production-ready product.',
    'Cover a balanced mix of product features, UI/UX, architecture, API work, 3D experience, testing, CI/CD, security, observability, documentation, onboarding, and release readiness.',
    'Prefer concrete implementation tasks over vague ideas.',
    'Avoid duplicates, avoid trivial chores, and avoid issues for work that already appears implemented.',
    'Each issue body must include these markdown sections in order: ## Summary, ## Why, ## Scope, ## Suggested acceptance criteria.',
    'Acceptance criteria must be specific and testable.',
    'Use labels that reflect the work, such as enhancement, frontend, backend, 3d, testing, ci, docs, security, performance, ux, infrastructure, ai-generated.',
    'Always include ai-generated as one label.',
    'Assume the current repository is early-stage and needs both foundation and feature work.',
    'Repository context follows as JSON.',
    JSON.stringify(context),
  ].join('\n');

  const response = await client.responses.create({
    model,
    input: prompt,
  });

  const text = response.output_text?.trim();
  if (!text) {
    throw new Error('OpenAI returned an empty response.');
  }

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('OpenAI response was not an array.');
  }

  return parsed.slice(0, Math.max(0, maxIssues));
}

const readme = readIfExists('README.md');
const packageJson = readIfExists('package.json');
const tsconfig = readIfExists('tsconfig.json');
const workflowFiles = listFiles('.github/workflows');
const srcFiles = listFiles('src').slice(0, 200);
const docsFiles = listFiles('docs').slice(0, 100);
const keyFiles = readMany([
  'README.md',
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'src/app/page.tsx',
  'src/app/layout.tsx',
  'docs/ci-cd.md',
  'docs/ai-issue-generator.md',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-preview.yml',
  '.github/workflows/deploy-production.yml',
  '.github/workflows/issue-generator.yml',
]);

const context = {
  projectName: path.basename(root),
  readme: readme.slice(0, 12000),
  packageJson,
  tsconfig,
  workflowFiles,
  srcFiles,
  docsFiles,
  keyFiles,
};

const fallbackIssues = buildFallbackIssues({ readme, packageJson, workflowFiles, srcFiles });
const hostedIssues = await buildHostedIssues(context);
const issues = (hostedIssues ?? fallbackIssues).slice(0, Math.max(0, maxIssues));

fs.mkdirSync(path.join(root, '.github', 'generated'), { recursive: true });
fs.writeFileSync(path.join(root, '.github', 'generated', 'issues.json'), JSON.stringify(issues, null, 2));
console.log(`Generated ${issues.length} issue payload(s) using ${hostedIssues ? 'OpenAI' : 'fallback rules'}.`);
