# RiskScan – real‑time financial risk scanner

[![CI](https://github.com/lwensveen/risk-scan/actions/workflows/ci.yml/badge.svg)](https://github.com/lwensveen/risk-scan/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/lwensveen/risk-scan/branch/main/graph/badge.svg)](https://codecov.io/gh/lwensveen/risk-scan)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/en/v1.0.0/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)
![Runtime: Bun + Node](https://img.shields.io/badge/runtime-bun%20%2B%20node-000?logo=bun&logoColor=fff)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-6E9F18.svg)](https://vitest.dev/)
[![Turborepo](https://img.shields.io/badge/monorepo-turborepo-000000.svg?logo=vercel&logoColor=white)](https://turbo.build/repo)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/lwensveen/risk-scan/issues)

**RiskScan** is a full‑stack, TypeScript‑first platform that surfaces emerging financial risks in real‑time.

- **ETL(serverless)** → pulls structured data from Yahoo Finance, SEC API, FRED, on‑chain sources, etc.
- **Risk Engine** → pluggable rule sets (`engine‑core`, `engine‑tail`) create human‑readable risk flags.
- **API (Fastify)** → JSON endpoints for flags & snapshots plus a signed QStash webhook for daily ingest.
- **Web Dashboard (Next 15 / Tailwind)** → interactive charts, ticker filters, CSV/PNG export.

---

## 30‑second quick‑start (demo)

```bash
git clone https://github.com/lwensveen/risk-scan
cd risk-scan
bun install

# run Postgres + API
docker compose up -d

# ingest three sample tickers (≈ 30s)
bun run seed-demo

# query the latest flag
curl localhost:4000/flags/NVDA/latest
```

---

## Architecture

```mermaid
graph TD
  subgraph Ingest
    A[ETL (Yahoo, SEC, On‑chain)] --> B[PostgreSQL]
  end
  subgraph Engine
    B --> C[engine‑core\nBank rules]
    B --> D[engine‑tail\nREIT/BDC/Stablecoin]
  end
  C --> E[Risk flags]
  D --> E
  subgraph API
    E --> F[Fastify JSON API]
  end
  subgraph Frontend
    F --> G[Next.js dashboard]
  end
```

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

## Web dashboard highlights

| Feature              | Path                                | Notes                         |
|----------------------|-------------------------------------|-------------------------------|
| **Flag table**       | `apps/web/app/(dashboard)/flags`    | Severity badges, copy‑to‑CSV  |
| **Ticker compare**   | `apps/web/app/(dashboard)/compare`  | Multi‑series chart (Recharts) |
| **Snapshot details** | `apps/web/app/(dashboard)/[ticker]` | Raw metrics + rule breakdown  |
| Theme                | Radix UI + `next-themes`            | Auto dark/light               |
| Export PNG           | Client‑side `html-to-image`         | Slide‑deck ready              |

---

## API summary

| Method | Endpoint                    | Description                                                   |
|--------|-----------------------------|---------------------------------------------------------------|
| POST   | `/internal/daily-risk-scan` | QStash‑signed webhook → runs ETL + engines                    |
| GET    | `/flags`                    | Filter by `tickers`, `category`, `from`, `to`, `useCreatedAt` |
| GET    | `/flags/:ticker`            | All flags for one ticker                                      |
| GET    | `/flags/:ticker/latest`     | Latest flag for one ticker                                    |
| GET    | `/snapshot`                 | Filter snapshots by ticker/date                               |
| GET    | `/replay/:ticker/:category` | Re‑run rules on latest snapshot                               |
| POST   | `/replay`                   | Ad‑hoc payload rule evaluation                                |

_OpenAPI JSON spec coming soon._

---

## Deployment

- **Database**: Neon or Supabase (PostgreSQL >= 15).
- **Backend**(API + ETL): Vercel functions (Edge Runtime), QStash for scheduling.
- **Frontend**: Vercel (Next.js 15). Set `NEXT_PUBLIC_API_URL` to your API URL.

One‑click deploy scripts live in `.github/workflows/`.

---

## Roadmap

- **Pagination & infinite scrolling** for large flag tables
- **Full-text search** across flag descriptions and snapshots
- **ML‑based confidence scoring** to prioritise high‑signal flags
- **ESG & macro rule packs** (green bonds, inflation shocks, etc.)
- **Portfolio view** – aggregate risk by user‑defined ticker baskets or wallet holdings
- **OpenAPI JSON spec** + auto‑generated typed SDK
- **Playground UI** for ad‑hoc `/replay` testing in the browser
- **E2E tests** (Playwright) running in CI
