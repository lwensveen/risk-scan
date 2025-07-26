import * as path from 'node:path';
import { marked } from 'marked';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';

const srcDir = process.argv[2] || 'docs';

marked.use({ gfm: true });

type MermaidBlock = { token: string; code: string };

function extractMermaid(md: string): {
  replaced: string;
  blocks: MermaidBlock[];
} {
  const blocks: MermaidBlock[] = [];
  let idx = 0;
  const fence = /^[ \t]*```mermaid[^\n]*\r?\n([\s\S]*?)^[ \t]*```\s*$/gim;
  const replaced = md.replace(fence, (_m, code) => {
    const token = `<!--MERMAID_BLOCK_${idx++}-->`;
    blocks.push({ token, code: String(code).trimEnd() });
    return token;
  });
  return { replaced, blocks };
}

function wrapTables(html: string): string {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, (_m, inner) => {
    return `<div class="table-wrap"><table>${inner}</table></div>`;
  });
}

function injectMermaid(html: string, blocks: MermaidBlock[]): string {
  let out = html;
  for (const { token, code } of blocks) {
    out = out.replace(token, `<div class="mermaid">\n${code}\n</div>`);
  }
  return out;
}

const template = (title: string, body: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root{
      --fg:#111827; --bg:#fff; --muted:#6b7280; --border:#e5e7eb;
      --code-bg:#f6f8fa; --thead:#f8fafc; --zebra:#f9fafb; --link:#111827;
    }
    @media (prefers-color-scheme: dark){
      :root{
        --fg:#e5e7eb; --bg:#0b0f16; --muted:#9ca3af; --border:#293142;
        --code-bg:#0f172a; --thead:#0b1220; --zebra:#0d1526; --link:#e5e7eb;
      }
    }
    html,body{height:100%}
    body{
      max-width:960px;margin:2rem auto;padding:0 1rem;
      font:16px/1.65 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,"Helvetica Neue",Arial;
      color:var(--fg);background:var(--bg);
    }
    h1,h2,h3{line-height:1.25;margin:1.5rem 0 .75rem}
    h1{font-size:1.9rem} h2{font-size:1.5rem} h3{font-size:1.25rem}
    p,ul,ol,blockquote,table,pre{margin:1rem 0}
    hr{border:none;border-top:1px solid var(--border);margin:2rem 0}
    code{
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
      font-size:.95em;background:var(--code-bg);padding:.12rem .35rem;border-radius:.3rem
    }
    pre{background:var(--code-bg);padding:.75rem;border-radius:.5rem;overflow:auto}
    pre code{background:transparent;padding:0}
    blockquote{border-left:4px solid var(--border);padding:.5rem 1rem;color:var(--muted);margin-left:0}
    .table-wrap{width:100%;overflow-x:auto}
    .table-wrap table{
      width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;
      border:1px solid var(--border);border-radius:.5rem;overflow:hidden
    }
    thead{background:var(--thead)}
    th,td{
      padding:.6rem .8rem;border-bottom:1px solid var(--border);border-right:1px solid var(--border);
      text-align:left;vertical-align:top;word-wrap:break-word;overflow-wrap:anywhere
    }
    th:last-child,td:last-child{border-right:0}
    tbody tr:last-child td{border-bottom:0}
    tbody tr:nth-child(odd){background:var(--zebra)}
    caption{caption-side:bottom;color:var(--muted);padding:.5rem;font-size:.9rem}
    .mermaid{margin:1rem 0;overflow-x:auto;white-space:pre}
    .mermaid svg{max-width:100%;height:auto}
    a{color:var(--link);text-decoration:underline;text-underline-offset:2px}
  </style>

  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

    const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    function mermaidThemeVars(isDark) {
      return {
        background: css('--bg'),
        fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica Neue,Arial',
        primaryColor: isDark ? '#0d1526' : '#f9fafb',
        primaryTextColor: css('--fg'),
        primaryBorderColor: css('--border'),
        lineColor: css('--border'),
        clusterBkg: isDark ? '#0b1220' : '#f8fafc',
        clusterBorder: css('--border'),
        nodeBorder: css('--border'),
        actorBkg: isDark ? '#0b1220' : '#f8fafc',
        actorBorder: css('--border'),
        signalColor: css('--fg'),
        activationBkgColor: isDark ? '#121a2a' : '#eef2ff',
        activationBorderColor: css('--border'),
        sequenceNumberColor: css('--muted'),
        timelineColor: css('--fg'),
        timelineTextColor: css('--fg'),
        timelineSectionColor: isDark ? '#64748b' : '#334155',
        edgeLabelBackground: isDark ? '#0b0f16' : '#ffffff'
      };
    }

    function initMermaid() {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        themeVariables: mermaidThemeVars(isDark),
        themeCSS: \`
          .node rect, .node polygon { rx: 10; ry: 10; }
          .edgePath path, .cluster rect { filter: none; }
          .label, .sectionTitle { font-weight: 600; }
          .edgeLabel { padding: 2px 4px; border-radius: 4px; }
        \`
      });
      mermaid.run({ querySelector: '.mermaid' });
    }

    initMermaid();

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) {
      mq.addEventListener('change', () => { initMermaid(); });
    } else {
      mq.onchange = () => { initMermaid(); };
    }
  </script>
</head>
<body>
${body}
</body>
</html>`;

async function buildOne(filePath: string) {
  const md = await readFile(filePath, 'utf8');
  const { replaced, blocks } = extractMermaid(md);
  const htmlBodyRaw = (await marked.parse(replaced)) as string;
  const htmlBody = injectMermaid(wrapTables(htmlBodyRaw), blocks);

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
