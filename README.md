# doc2task

**Convert documents into actionable tasks using AI and MCP.**

Upload a document (PDF, DOCX, TXT or plain text), process it with any OpenAI-compatible model, and automatically create structured issues in your project management tool of choice (Plane, Jira, Trello) via [Model Context Protocol](https://modelcontextprotocol.io) servers.

## Monorepo Structure

```
doc2task/
├── web/        # Next.js 16 full-stack web application
└── services/    # Microservices to make the job easier and cheaper.
```

## Packages

### `web/` — Full Web Application

A complete Next.js application with authentication, document management, AI processing, and MCP integration.

**Stack:** Next.js 16 · TypeScript · PostgreSQL + Prisma · NextAuth.js · OpenAI SDK · Tailwind CSS

→ See [web/README.md](web/README.md) for full setup instructions.

**Quick start:**
```bash
cd web
npm install
cp .env.example .env   # fill in DB credentials and NEXTAUTH_SECRET
npx prisma migrate dev
npm run dev
```

To upload files you must run the service
```bash
cd services
pip install -r requirements.txt
fastapi dev doc2md.py
```

## Features

- **Document ingestion** — TXT, PDF, DOCX up to 10 MB (web) or inline text (scripts)
- **Agentic AI processing** — Multi-turn tool-calling loop with any OpenAI-compatible model
- **MCP integration** — Creates issues in Plane, Jira, or Trello via stdio MCP servers (`uvx`)
- **Prompt templates** — Customisable system prompts (web UI) or inline (scripts)
- **Encrypted API key vault** — AES-256-GCM storage (web)
- **Role-based access** — ADMIN / MANAGER / USER (web)

## Supported Platforms

| Platform | MCP Server | Required Variables |
|---|---|---|
| Plane | `plane-mcp-server` | `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, `PLANE_BASE_URL` |
| Jira | `atlassian-mcp-server` | `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` |
| Trello | `mcp-server-trello` | `TRELLO_API_KEY`, `TRELLO_TOKEN`, `TRELLO_BOARD_ID` |

## Prerequisites

- **Node.js** 18+ and **PostgreSQL** 14+ (for `web/`)
- **Python** 3.10+ (for `scripts/`)
- **uvx** — `pip install uv` or `pipx install uv`

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push and open a Pull Request

## License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.
