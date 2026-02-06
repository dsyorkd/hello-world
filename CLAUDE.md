# CLAUDE.md - RetireWise Financial Planning App

## Project Overview
RetireWise is a retirement/financial planning app using Monte Carlo simulations and AI-guided onboarding. Built on Cloudflare Pages + D1.

## Stack
- **Frontend:** React 19 + Vite 7, Chart.js, Tailwind CSS
- **Backend:** Cloudflare Pages Functions (serverless)
- **Database:** Cloudflare D1 (SQLite at the edge)
- **AI:** Anthropic Claude API (proxied through Pages Functions)
- **Testing:** Vitest (unit) + Playwright (E2E), target 90% coverage
- **Deploy:** GitHub Actions → Cloudflare Pages

## Key Directories
```
src/                    # React frontend
  components/           # React components (common/, onboarding/, dashboard/, models/, profile/)
  hooks/                # Custom React hooks
  utils/                # Utilities, API client, formatters
functions/              # Cloudflare Pages Functions (API)
  api/                  # All API routes
    auth/               # Login, session management
    users/              # User CRUD
    financial-profile/  # Financial data CRUD
    goals/              # Goal management
    models/             # Simulation engines (monte-carlo, fixed-return, three-scenario)
    scenarios/          # Saved scenario management
    ai/                 # LLM chat proxy
migrations/             # D1 database migrations (SQL)
docs/                   # PRD, OpenAPI spec, design docs
tests/                  # Test files
  unit/                 # Vitest unit tests
  e2e/                  # Playwright E2E tests
```

## Common Commands
```bash
npm run dev             # Vite dev server (port 3000)
npm run build           # Production build to dist/
npm run cf:dev          # Local dev with D1 binding
npm run test            # Run all tests
npm run test:unit       # Vitest unit tests
npm run test:e2e        # Playwright E2E tests
npm run test:coverage   # Coverage report (must be >= 90%)
npm run deploy          # Deploy to Cloudflare Pages
```

## Critical Rules
1. **NEVER commit secrets/keys/passwords** - Use Cloudflare secrets or .env (gitignored)
2. **DISCLAIMER REQUIRED** - Every user login shows modal + persistent banner: "NOT financial advice"
3. **OpenAPI contract** - Backend must conform to `docs/openapi.yaml`. Frontend consumes this spec.
4. **Tests before merge** - 90% coverage minimum, all tests passing per commit
5. **User data front and center** - Dashboard prioritizes user's financial info and progress

## Database
- **D1 Name:** hack-a-thon
- **D1 ID:** 0d18e7f4-3720-47a1-85a5-28014c5d7750
- **Binding:** `DB` (accessed via `context.env.DB` in Pages Functions)
- **Tables:** users, financial_profiles, goals, scenarios, conversations

## API Contract
- Full OpenAPI 3.1 spec at `docs/openapi.yaml`
- Session auth via `X-Session-Token` header
- All endpoints under `/api/`
- JSON request/response bodies

## Environment Variables (Cloudflare Secrets)
- `ANTHROPIC_API_KEY` - Claude API key (NEVER in code or git)
- Set via: `npx wrangler pages secret put ANTHROPIC_API_KEY`

## Deployment
- **Production:** retirewise.twistedlife.space
- **Pages project:** hello-world-app
- **CI:** Push to main triggers test → deploy → validate pipeline
- **Account ID:** 86be4cee951aa89f49634541ed658e39

## Development Workflow
- Orchestrator agent manages feature branches and merges
- Parallel work via git worktrees on `feat/api` and `feat/ui` branches
- All merges go through orchestrator to resolve conflicts before main

## Monte Carlo Engine
Risk profiles for simulation:
- Conservative: mean=6%, std=8%
- Moderate: mean=8%, std=12%
- Aggressive: mean=10%, std=16%
- Default: 1000 simulations, project to age 95
