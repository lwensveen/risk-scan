import path from 'node:path';
import { buildServer } from '../server.js';
import { mkdir, writeFile } from 'node:fs/promises';

const out = process.env.OPENAPI_OUT ?? 'docs/openapi.json';
const outPath = path.resolve(process.cwd(), out);
const app = await buildServer();

try {
  await app.ready();

  const spec = app.swagger();

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(spec, null, 2));

  console.log(`OpenAPI written: ${path.relative(process.cwd(), outPath)}`);
} catch (err) {
  console.error('OpenAPI generation failed:', err);
  process.exitCode = 1;
} finally {
  await app.close();
}
