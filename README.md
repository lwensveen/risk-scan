# RiskScan

**RiskScan** is a full‑stack, TypeScript‑first platform that surfaces emerging financial risks in real‑time.

* **ETL(serverless)** → pulls structured data from Yahoo Finance, SEC API, FRED, on‑chain sources, etc.
* **Risk Engine** → pluggable rule sets (`engine‑core`, `engine‑tail`) create human‑readable risk flags.
* **API (Fastify)** → JSON endpoints for flags & snapshots plus a signed QStash webhook for daily ingest.
* **Web Dashboard (Next 15 / Tailwind)** → interactive charts, ticker filters, CSV/PNG export.

---

## Monorepo layout

```
apps/
  api/   – Fastify server (ETL webhook + public JSON API)
  web/   – Next.js 15 dashboard (client‑side charts)
packages/
  etl/          – snapshot ingestion & persistence
  engine-core/  – Core banking risk rules
  engine-tail/  – REIT / BDC / Stablecoin etc. rules
  types/        – shared Zod schemas + enums
  utils/        – QStash/Slack helpers, global config
```

---

## Quick start (dev)

```bash
bun install            # install workspace deps
bunx turbo run dev     # spins up API on :4000 and Web on :3000
```

Create a `.env` at repo root:

```ini
DATABASE_URL=postgres://user:pass@host:5432/riskscan
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
SLACK_WEBHOOK_URL=...
FRED_KEY=...
```

> **Tip:**The default Vercel envs (`NEXT_PUBLIC_API_URL`, etc.) are already set in `apps/web/.env.example`.

---

## Web dashboard highlights

| Feature              | Path                                | Notes                              |
|----------------------|-------------------------------------|------------------------------------|
| **Flag table**       | `apps/web/app/(dashboard)/flags`    | Severity color badges, copy‑to‑CSV |
| **Ticker compare**   | `apps/web/app/(dashboard)/compare`  | Multi‑series chart via Recharts    |
| **Snapshot details** | `apps/web/app/(dashboard)/[ticker]` | Raw metrics + rule breakdown       |
| Dark / light theme   | Radix UI + `next-themes`            | Auto‑switches via OS setting       |
| Export PNG           | Client‑side `html-to-image`         | Perfect for slide decks            |

---

## API summary

| Method | Endpoint                    | Description                                                   |
|--------|-----------------------------|---------------------------------------------------------------|
| `POST` | `/internal/daily-risk-scan` | QStash‑signed webhook → runs ETL + engines                    |
| `GET`  | `/flags`                    | Filter by `tickers`, `category`, `from`, `to`, `useCreatedAt` |
| `GET`  | `/flags/:ticker`            | All flags for one ticker                                      |
| `GET`  | `/snapshot`                 | Filter snapshots by ticker/date                               |
| `GET`  | `/replay/:ticker/:category` | Re‑run rules on latest snapshot                               |
| `POST` | `/replay`                   | Ad‑hoc payload rule evaluation                                |

Full OpenAPI spec coming soon.

---

## Deployment

* **Database**: Neon or Supabase (PostgreSQL >= 15).
* **Backend**(API + ETL): Vercel functions (Edge Runtime), QStash for scheduling.
* **Frontend**: Vercel (Next.js 15). Set `NEXT_PUBLIC_API_URL` to your API URL.

One‑click deploy scripts live in `.github/workflows/`.

---

## Roadmap

* **Pagination & infinite scrolling** for large flag tables
* **Full-text search** across flag descriptions and snapshots
* **ML‑based confidence scoring** to prioritise high‑signal flags
* **ESG & macro rule packs** (green bonds, inflation shocks, etc.)
* **Portfolio view** – aggregate risk by user‑defined ticker baskets or wallet holdings
* **OpenAPI JSON spec** + auto‑generated typed SDK
* **Playground UI** for ad‑hoc `/replay` testing in the browser
* **E2E tests** (Playwright) running in CI
* **Docker compose** stack for local dev (Postgres + Redis + API + Web)
