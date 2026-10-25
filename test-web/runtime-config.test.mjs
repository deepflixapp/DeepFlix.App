import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('deployment and browser use the server backend instead of the obsolete client adapter', async () => {
  const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  const [config, app, adapter, publicWorker] = await Promise.all([
    read('wrangler.toml'), read('web/app.js'), read('web/client-adapter.js'), read('web/worker.js'),
  ]);
  assert.match(config, /main\s*=\s*"worker\/index\.mjs"/);
  assert.match(config, /\[env\.preview\]/);
  assert.equal((config.match(/binding\s*=\s*"DB"/g) || []).length, 2);
  assert.doesNotMatch(app, /deepflix_local_user|window\.fetchGistDirect|window\.fetchPlayDirect/);
  for (const source of [adapter, publicWorker]) {
    assert.doesNotMatch(source, /(?:TOKEN|SECRET)\s*=|export default/);
  }
});
