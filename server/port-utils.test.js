import test from 'node:test';
import assert from 'node:assert/strict';

import { findAvailablePort } from './port-utils.js';

test('findAvailablePort skips busy ports and picks the next free port', async () => {
  const busyPorts = new Set([8080]);

  const port = await findAvailablePort({
    preferredPort: 8080,
    portRange: [8080, 8081, 8082],
    isPortBusy: async (candidate) => busyPorts.has(candidate),
  });

  assert.equal(port, 8081);
});
