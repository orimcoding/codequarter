import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GH_TOKEN;
const issuesPath = path.join(root, '.github', 'generated', 'issues.json');

if (!repo || !token) {
  throw new Error('Missing GITHUB_REPOSITORY or GH_TOKEN.');
}

if (!fs.existsSync(issuesPath)) {
  console.log('No generated issues file found. Skipping.');
  process.exit(0);
}

const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf8'));
if (!Array.isArray(issues) || issues.length === 0) {
  console.log('No issues to create.');
  process.exit(0);
}

const existingIssuesResponse = await fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=100`, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'codequarter-issue-generator',
  },
});

if (!existingIssuesResponse.ok) {
  throw new Error(`Failed to fetch existing issues: ${existingIssuesResponse.status}`);
}

const existingIssues = await existingIssuesResponse.json();
const existingTitles = new Set(existingIssues.map((issue) => issue.title));

for (const issue of issues) {
  if (existingTitles.has(issue.title)) {
    console.log(`Skipping existing issue: ${issue.title}`);
    continue;
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'codequarter-issue-generator',
    },
    body: JSON.stringify({
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create issue \"${issue.title}\": ${response.status} ${text}`);
  }

  console.log(`Created issue: ${issue.title}`);
}
