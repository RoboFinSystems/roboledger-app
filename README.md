# RoboLedger App

**The general ledger and financial reporting app built on [RoboSystems](https://github.com/RoboFinSystems/robosystems), the open-source knowledge graph for finance.** RoboLedger is a full accounting system in its own right: close, consolidation, schedules, bank feeds, reconciliations and forecasting, every number traced to the entry. This repository is its web app, served at [roboledger.ai](https://roboledger.ai).

The books live in an entity graph, where everything written is a block: [Event Blocks](https://robosystems.ai/docs/technical/event-driven-ledger) record what happened and the ledger derives the debits and credits, [Information Blocks](https://robosystems.ai/docs/technical/information-blocks) are the statements, schedules, metrics and disclosures, and [Taxonomy Blocks](https://robosystems.ai/docs/technical/taxonomy-and-frameworks) carry `rs-gaap`, the reporting taxonomy the chart of accounts maps to. Your AI agents work the same books over MCP; the app is where you connect them, see what the agent is working from, and review and approve what it did.

## What it does

- **Entity**: the selected company's details and industry classification, the reporting group (a parent and its subsidiaries), and **Connections**: [QuickBooks](https://quickbooks.intuit.com/partners/affiliates?cid=par_pim_4TcakSEFQs73) as the books of record, and bank feeds through [Plaid](https://plaid.com) and [Mercury](https://mercury.com/partner/robosystems)
- **Agents**: the counterparties (customers, vendors, employees) with their activity and, for bank-feed counterparties, a default account learned from the lines you approve
- **Ledger**: chart of accounts with its mapping to reporting concepts (by hand or by the mapping operator), bank accounts, journal, trial balance, account register, and receivables and payables aged by counterparty
- **Inbox**: a bank transaction arrives with a suggested account, and nothing reaches the ledger until someone approves it, one line at a time or in a batch
- **Posting Rules**: the rules that turn a matching event into journal entries; one an AI agent writes books nothing until it is approved
- **Statements**: balance sheet, income statement, cash flow and statement of equity read live from the ledger for any period, and on a group parent the combined, consolidated and worksheet views. No close needed
- **Closing Book**: the period close and whatever is holding it up, with schedules and their monthly entries, reconciliations, transactions that changed in QuickBooks after a sync, consolidation entries and account rollups
- **Reports**: multi-period reports through a reporting style, with a draft-to-filed lifecycle; download one as a holon (RDF), a DataBook (the holon as a Markdown document, every figure linked to its fact), an Excel workbook, a compiled JSON model or XBRL 2.1; share it to other graphs through publish lists, and read the reports others share with you
- **Explorer**: any statement, schedule, set of metrics or scenario as a series over time: a table, a chart, its facts, its elements, and the checks it passed with the rules behind them
- **Plan**: actuals and a forecast scenario's assumptions in one monthly grid, through the same statement structures
- **Library**: the reporting concepts accounts map to, with their definitions and how they roll up into each statement
- **Console**: ask about the books from the bar at the bottom of every page; `/do` makes a scoped change, such as drafting the schedule entries that are due or sorting Inbox lines
- **Search**: search across the graph's documents, such as accounting policies and close procedures

The same app serves the public site at roboledger.ai: the landing page, product pages, the blog, and the product docs at [`/docs`](https://roboledger.ai/docs).

## Quick Start

Needs Node.js 26 (see `.nvmrc`) and a RoboSystems API: `just start` in a [robosystems](https://github.com/RoboFinSystems/robosystems) checkout, or a hosted one. Against a local API, sign in with the demo user that `just demo-user` creates there.

```bash
npm install
cp .env.example .env     # points at a local API on http://localhost:8000
npm run dev              # http://localhost:3001
```

**In Docker instead.** From the backend checkout, `just start apps` runs the published images of all three apps against your local API: RoboSystems on http://localhost:3000, RoboLedger on 3001, RoboInvestor on 3002. To build them from your checkouts, see [Local Development: Web Apps](https://robosystems.ai/docs/technical/local-development#web-apps). In that profile the landing page shows a maintenance screen; sign in at `/login`.

Sandbox QuickBooks and Plaid connect over `localhost`, and a Mercury token needs no callback at all; a production QuickBooks or Plaid connection needs a public HTTPS origin, from `npm run tunnel:ngrok` or `npm run tunnel:cloudflared` (configured in `.env.example`). See [Connecting QuickBooks Locally](https://robosystems.ai/docs/technical/connecting-quickbooks-locally) and [Connecting Bank Feeds Locally](https://robosystems.ai/docs/technical/connecting-bank-feeds-locally).

The settings that matter locally, all in `.env.example`:

| Variable                                                                                                | Purpose                                                              |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_ROBOSYSTEMS_API_URL`                                                                       | The API the app calls                                                |
| `NEXT_PUBLIC_ROBOSYSTEMS_APP_URL`, `NEXT_PUBLIC_ROBOLEDGER_APP_URL`, `NEXT_PUBLIC_ROBOINVESTOR_APP_URL` | The three apps, for moving between them signed in                    |
| `NEXT_PUBLIC_S3_ENDPOINT_URL`                                                                           | The local stack's S3 server, for report bundles; unset in production |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                                                                        | Cloudflare Turnstile on the public forms; empty turns it off         |

### Deploying your own

1. Fork this repository and the [robosystems](https://github.com/RoboFinSystems/robosystems) backend.
2. Run `just bootstrap` in the backend: it deploys OIDC and sets this repository's `AWS_ROLE_ARN`, `AWS_ACCOUNT_ID` and `AWS_REGION`.
3. Run `npm run setup:gha` here to set the remaining deployment variables.
4. Deploy with `npm run deploy:staging` or `npm run deploy:prod`, which run the deployment workflows.

The compute is chosen by the `APP_COMPUTE` GitHub variable (`apprunner` by default; per environment with `APP_COMPUTE_PROD` / `APP_COMPUTE_STAGING`). App Runner is closed to new AWS customers, so an account that has never used it must set `APP_COMPUTE=ecs-express`. Without a default VPC, also set `ECS_SUBNETS` to comma-separated public subnet IDs in at least two AZs. See the [Bootstrap Guide](https://robosystems.ai/docs/technical/bootstrap-guide).

## Development

```bash
npm run dev              # development server on port 3001
npm run build            # production build (npm run start to serve it)
npm run test             # Vitest suite
npm run test:watch       # Vitest in watch mode
npm run test:coverage    # coverage report
npm run test:all         # tests, then format, lint fix, typecheck and cfn-lint
npm run lint             # ESLint (lint:fix to fix)
npm run format:check     # Prettier (format to write)
npm run typecheck        # TypeScript
```

`test:all` rewrites files (Prettier and `eslint --fix`), and its `cfn-lint` step runs through `uvx`, so it needs [uv](https://docs.astral.sh/uv/).

Shared components come from [`@robosystems/core`](https://www.npmjs.com/package/@robosystems/core) ([robosystems-core](https://github.com/RoboFinSystems/robosystems-core)), used by all three apps. Changes are made there and reach this app through a version bump: `npm install @robosystems/core@latest`, then `npm run sync:demos` to copy its demo runtime into `public/demos/`.

## Architecture

- **Next.js 16** App Router, React 19, TypeScript 5 and Tailwind CSS 4
- **[`@robosystems/core`](https://www.npmjs.com/package/@robosystems/core)**: sign-in and session, the graph and entity contexts, layout, the console, background-job progress over SSE, and the UI primitives in `@robosystems/core/ui`
- **[`@robosystems/report-components`](https://www.npmjs.com/package/@robosystems/report-components)**: statement and report rendering
- **[`@robosystems/client`](https://www.npmjs.com/package/@robosystems/client)**: every call to the API. Reads are GraphQL at `/extensions/{graph_id}/graphql`; writes are named operations at `/extensions/roboledger/{graph_id}/operations/{name}`. See [Extensions Surface Overview](https://robosystems.ai/docs/technical/extensions-surface-overview)
- **Connections**: QuickBooks, Plaid and Mercury connect through the API, which holds the provider credentials; the app runs the sign-in flow and its callback, and holds no ledger data of its own

**On AWS:** App Runner or ECS Express Mode behind CloudFront, with static assets on S3, deployed from the CloudFormation templates in [`cloudformation/`](cloudformation/) by GitHub Actions. Release images are also published to Docker Hub, which is what `just start apps` runs.

## Documentation

- **Product docs**: [roboledger.ai/docs](https://roboledger.ai/docs), what the app does, page by page
- **Technical docs**: [robosystems.ai/docs/technical](https://robosystems.ai/docs/technical). For this app: [RoboLedger Operations](https://robosystems.ai/docs/technical/roboledger-operations) · [GraphQL Reads](https://robosystems.ai/docs/technical/graphql-reads) · [Period Close](https://robosystems.ai/docs/technical/period-close) · [Group Consolidation](https://robosystems.ai/docs/technical/group-consolidation) · [Chart of Accounts Mapping](https://robosystems.ai/docs/technical/chart-of-accounts-mapping) · [Connections and Bank Feeds](https://robosystems.ai/docs/technical/connections-and-bank-feeds) · [Reporting and Rendering](https://robosystems.ai/docs/technical/reporting-and-rendering) · [Serialization and Export](https://robosystems.ai/docs/technical/serialization-and-export) · [Forecasting and Metrics](https://robosystems.ai/docs/technical/forecasting-and-metrics)
- **API reference**: [robosystems.ai/docs/api](https://robosystems.ai/docs/api)

## Support

- [Issues](https://github.com/RoboFinSystems/roboledger-app/issues) · [Discussions](https://github.com/orgs/RoboFinSystems/discussions) · [Projects](https://github.com/orgs/RoboFinSystems/projects)
- [CONTRIBUTING.md](.github/CONTRIBUTING.md): branch conventions, coding standards and the pull request process

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details. The license does not cover the RoboSystems and RoboLedger names or logos; see [NOTICE](NOTICE).

Apache-2.0 © 2026 RFS LLC

## Disclosures

<sub>Mercury is a fintech company, not an FDIC-insured bank. Banking services provided through Choice Financial Group and Column N.A., Members FDIC.</sub>
