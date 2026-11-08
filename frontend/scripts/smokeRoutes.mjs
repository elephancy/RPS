import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(frontendRoot, 'src', 'App.jsx'), 'utf8');
const registrySource = fs.readFileSync(path.join(frontendRoot, 'src', 'config', 'appRoutes.mjs'), 'utf8');

const appPaths = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)]
  .map(match => match[1])
  .filter(route => route !== '*')
  .sort();

const registryPaths = [...registrySource.matchAll(/path:\s*'([^']+)'/g)]
  .map(match => match[1])
  .sort();
const validEntries = new Set(['navbar', 'home', 'dashboard', 'games', 'bets', 'auth', 'footer', 'leaderboard']);

const missingFromRegistry = appPaths.filter(route => !registryPaths.includes(route));
const missingFromApp = registryPaths.filter(route => !appPaths.includes(route));
const missingEntry = [...registrySource.matchAll(/\{\s*path:\s*'([^']+)'[\s\S]*?entry:\s*'([^']+)'[\s\S]*?\}/g)]
  .map(match => ({ path: match[1], entry: match[2] }))
  .filter(route => !validEntries.has(route.entry));
const entryCount = [...registrySource.matchAll(/entry:\s*'([^']+)'/g)].length;
const missingEntryMetadata = registryPaths.length !== entryCount;
const duplicatePaths = registryPaths.filter((route, index) => registryPaths.indexOf(route) !== index);

if (missingFromRegistry.length || missingFromApp.length || missingEntry.length || duplicatePaths.length || missingEntryMetadata) {
  console.error('Route smoke check failed.');
  if (missingFromRegistry.length) console.error('Missing from registry:', missingFromRegistry.join(', '));
  if (missingFromApp.length) console.error('Missing from App.jsx:', missingFromApp.join(', '));
  if (missingEntry.length) console.error('Invalid entry metadata:', missingEntry.map(route => route.path).join(', '));
  if (missingEntryMetadata) console.error('Every route must declare entry metadata.');
  if (duplicatePaths.length) console.error('Duplicate registry paths:', duplicatePaths.join(', '));
  process.exit(1);
}

console.log(`Route smoke check passed for ${appPaths.length} routes.`);
