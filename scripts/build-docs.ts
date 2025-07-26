import * as path from 'node:path';
import { marked } from 'marked';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';

const srcDir = process.argv[2] || 'docs';

function convertMermaidFences(md: string): string {
  const fence = /^```mermaid\s*\n([\s\S]*?)^```/gm;
  return md.replace(
    fence,
    (_m, code) => `<div class="mermaid">\n${code}\n</div>`
  );
}

const template = (title: string, body: string) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body{max-width:960px;margin:2rem auto;padding:0 1rem;font:16px/1.6 system-ui}
    pre{background:#f6f8fa;padding:0.75rem;border-radius:8px;overflow:auto}
    code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body>
${body}
<script>mermaid.initialize({ startOnLoad: true });</script>
</body>
</html>`;

async function buildOne(filePath: string) {
  const md = await readFile(filePath, 'utf8');
  const mdProcessed = convertMermaidFences(md);
  const htmlBody = (await marked.parse(mdProcessed)) as string;

  const base = path.basename(filePath, '.md');
  const matchH1 = htmlBody.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = matchH1?.[1] ?? base;

  const outPath = filePath.replace(/\.md$/i, '.html');
  await writeFile(outPath, template(title, htmlBody), 'utf8');
  console.log(`Built ${path.relative(process.cwd(), outPath)}`);
}

async function run() {
  const st = await stat(srcDir);
  if (!st.isDirectory()) throw new Error(`${srcDir} is not a directory`);
  await mkdir(srcDir, { recursive: true });

  const entries = await readdir(srcDir);
  const mdFiles = entries.filter((f) => f.toLowerCase().endsWith('.md'));
  await Promise.all(mdFiles.map((f) => buildOne(path.join(srcDir, f))));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
