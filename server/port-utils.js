export async function findAvailablePort({
  preferredPort = 8080,
  portRange,
  isPortBusy = async (port) => {
    const { createServer } = await import('node:net');
    return await new Promise((resolve) => {
      const tester = createServer();
      tester.once('error', () => resolve(true));
      tester.once('listening', () => {
        tester.close(() => resolve(false));
      });
      tester.listen(port, '0.0.0.0');
    });
  },
} = {}) {
  const candidates = portRange ?? Array.from({ length: 12 }, (_, index) => preferredPort + index);

  for (const candidate of candidates) {
    if (!Number.isInteger(candidate) || candidate < 1) continue;
    const busy = await isPortBusy(candidate);
    if (!busy) return candidate;
  }

  throw new Error(`No available port found in range ${candidates.join(', ')}`);
}
