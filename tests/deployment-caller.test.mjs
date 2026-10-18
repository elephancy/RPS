import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const workflowFiles = readdirSync('.github/workflows').filter((name) => /\.ya?ml$/.test(name));
const deploymentGuide = readFileSync('deploy/README.md', 'utf8');
const ci = readFileSync('.github/workflows/ci.yml', 'utf8');

test('production publication belongs exclusively to the private controller', () => {
  assert.equal(existsSync('.github/workflows/deploy-api.yml'), false);
  assert.equal(existsSync('.github/hetzner-release.json'), false);
  for (const filename of workflowFiles) {
    const workflow = readFileSync(`.github/workflows/${filename}`, 'utf8');
    assert.doesNotMatch(workflow, /HetznerReleaseGateway|id-token:\s*write/i);
    assert.doesNotMatch(workflow, /HETZNER_|DEPLOY_(?:HOST|USER|PATH|KEY)|SSH_PRIVATE_KEY|secrets:\s*inherit/i);
  }
});

test('application CI retains every audit, lint, build and backend gate', () => {
  assert.match(ci, /name: CI/);
  assert.match(ci, /branches:\s*\[main\]/);
  for (const command of [
    'npm audit --audit-level=high',
    'npm --prefix frontend audit --audit-level=high',
    'npm --prefix frontend audit --omit=dev --audit-level=high',
    'npm --prefix backend audit --audit-level=high',
    'npm run lint',
    'npm --prefix frontend run build',
    'npm --prefix backend test',
    'npm run test:deployment',
    "require('./backend/controllers/authController')",
  ]) {
    assert.ok(ci.includes(command), `Required CI gate is missing: ${command}`);
  }
});

test('application repository has no direct-host credential or command surface', () => {
  for (const filename of workflowFiles) {
    const workflow = readFileSync(`.github/workflows/${filename}`, 'utf8');
    assert.doesNotMatch(workflow, /\b(?:ssh|scp|rsync)\b|\/opt\/|HETZNER_(?:HOST|USER|PATH|SSH_KEY)/i);
  }
  assert.doesNotMatch(deploymentGuide, /\b(?:ssh|scp|rsync)\b|\/opt\/|HETZNER_(?:HOST|USER|PATH|SSH_KEY)|git\s+pull/i);
  assert.equal(existsSync('deploy/Caddyfile.example'), false);
  assert.equal(existsSync('deploy/caddy/docker-compose.yml.example'), false);
});
