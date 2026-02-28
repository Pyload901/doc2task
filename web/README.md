# Doc2Task

**Admin-first application that converts documents into actionable tasks using AI and creates them in project management tools via MCP (Model Context Protocol).**

Upload documents (text, PDF, DOCX), process them with an AI model (OpenAI-compatible), and automatically create issues in **Plane**, **Jira**, or **Trello**.

## Features

- **Document Management** — Upload and manage documents (text input or file upload: TXT, PDF, DOCX up to 10 MB)
- **AI Processing** — Analyze documents with any OpenAI-compatible model (OpenAI, DeepSeek, Ollama, etc.) and generate structured task breakdowns
- **MCP Integration** — Create issues directly in Plane, Jira, or Trello via Model Context Protocol servers (JSON-RPC over stdio with `uvx`)
- **Prompt Templates** — Configurable system prompts for AI processing with a default template optimized for technical backlogs
- **API Key Vault** — Encrypted storage for AI provider keys (AES-256-GCM with scrypt key derivation)
- **User Management** — Admin-first model: first registered user becomes ADMIN, subsequent users created by admins only
- **Role-Based Access** — Three roles: ADMIN (full access), MANAGER (process documents), USER (view only)
- **Authentication** — NextAuth.js with JWT sessions and credentials provider

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | PostgreSQL + Prisma 5 ORM |
| Auth | NextAuth.js 5 (beta) |
| AI | OpenAI SDK 6 (compatible with any OpenAI-compatible API) |
| MCP | @modelcontextprotocol/sdk via `uvx` (stdio transport) |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |

## Prerequisites

- **Node.js** 18+ (LTS)
- **PostgreSQL** 14+
- **uvx** (for MCP server execution) — install via `pip install uvx` or `pipx install uvx`

## Getting Started

### 1. Clone & Install

```bash
cd doc2task
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials and a secure NEXTAUTH_SECRET
```

### 3. Set Up Database

```bash
# Create the PostgreSQL database
createdb doc2task

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to inspect data
npx prisma studio
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

### 5. Create Admin User

Navigate to [http://localhost:3000/register](http://localhost:3000/register). The first user registered automatically becomes an **ADMIN**. Registration is disabled after the first user — additional users must be created by the admin from the Users page.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login & registration pages
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── documents/       # Document list & detail pages
│   │   ├── settings/        # API keys, MCP configs, prompt templates
│   │   ├── tasks/           # Task listing
│   │   └── users/           # Admin user management
│   └── api/                 # API routes
├── components/
│   ├── auth/                # Login & register forms
│   └── ui/                  # Reusable UI components (Button, Card, Input, Textarea)
├── lib/
│   ├── ai.ts                # AI processing with OpenAI SDK
│   ├── auth.ts              # NextAuth configuration
│   ├── encryption.ts        # AES-256-GCM encryption for API keys
│   ├── prisma.ts            # Prisma client singleton
│   └── mcp/                 # MCP client & server configurations
├── types/                   # TypeScript type definitions
└── proxy.ts                 # Auth proxy (route protection)
```

## Usage Workflow

1. **Configure AI** — Go to Settings → API Keys and add your OpenAI or compatible API key
2. **Configure MCP** (optional) — Go to Settings → MCP Integrations and set up Plane/Jira/Trello with required environment variables
3. **Set Prompt** — Go to Settings → Prompts to customize the AI system prompt (a default is created on registration)
4. **Upload Document** — Go to Documents and create a new document via text input or file upload
5. **Process** — Open a document, select the target platform, and click "Process & Create Tasks"
6. **View Tasks** — Check the Tasks page for created issues with their external IDs and statuses

## MCP Server Configuration

Each platform requires specific environment variables:

| Platform | MCP Server Package | Required Vars |
|----------|-------------------|---------------|
| **Jira** | `atlassian-mcp-server` | `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` |
| **Trello** | `mcp-server-trello` | `TRELLO_API_KEY`, `TRELLO_TOKEN`, `TRELLO_BOARD_ID` |
| **Plane** | `plane-mcp-server` | `PLANE_API_URL`, `PLANE_API_TOKEN`, `PLANE_WORKSPACE_SLUG`, `PLANE_PROJECT_ID` |

## Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Database Schema

Six main models:

- **User** — Authentication, roles (ADMIN, MANAGER, USER)
- **Document** — Uploaded content with processing status
- **Task** — Created issues linked to documents and platforms
- **ApiKey** — Encrypted AI provider credentials
- **McpConfig** — MCP server configurations per platform
- **PromptTemplate** — Customizable AI system prompts

## License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.
