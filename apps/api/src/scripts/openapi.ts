import { writeFile } from 'node:fs/promises';
import { buildServer } from '../server.js';

const app = await buildServer();
await app.ready();
const spec = app.swagger();
await writeFile('docs/openapi.json', JSON.stringify(spec, null, 2));
await app.close();
