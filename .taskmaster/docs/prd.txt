# RetireWise - Financial Planning App PRD

## Product Requirements Document
**Version:** 1.0
**Date:** 2026-02-06
**Hackathon Deadline:** 1 hour from start
**Stack:** React + Vite | Cloudflare Pages Functions | D1 (SQLite) | LLM Integration

---

## 1. Vision & Disclaimer

**RetireWise** is a retirement/financial planning tool that uses Monte Carlo simulations and retirement models to help users visualize their financial future. It leverages AI to guide users through onboarding and model selection.

> **CRITICAL:** This application is NOT financial advice. It is for entertainment and educational purposes only. Every login must surface a banner AND a modal popup with this disclaimer that the user must acknowledge.

---

## 2. Core User Journey

```
[Landing Page] → [Disclaimer Modal] → [AI-Guided Onboarding] → [Model Selection] → [Dashboard]
      │                                       │                        │                │
      │                               Conversational AI          Visual comparison   Track progress
      │                               collects parameters        of model types      against goals
      │                                       │                        │                │
      └───────────────────────────────────────┴────────────────────────┴────────────────┘
                                    All data persisted to D1
```

### 2.1 Landing Page
- Clean, professional financial app aesthetic
- "Get Started" CTA
- Brief value proposition (3 bullet points max)
- Disclaimer footer text

### 2.2 Disclaimer System (EVERY LOGIN)
- **Modal popup:** Must be acknowledged (click "I Understand") before proceeding
- **Persistent banner:** Remains visible at top of app at all times
- Text: "RetireWise is for educational and entertainment purposes only. This is NOT financial advice. Consult a qualified financial advisor for personalized guidance."

### 2.3 AI-Guided Onboarding
The LLM conducts a conversational onboarding flow, collecting:

**Personal Information:**
- Name, age, target retirement age
- Current employment status
- Risk tolerance (conservative / moderate / aggressive)

**Financial Parameters:**
- Current savings / net worth
- Annual income
- Monthly savings rate / contribution amount
- Existing retirement accounts (401k, IRA, Roth, etc.)
- Expected Social Security benefit (optional)
- Current debt obligations

**Goals:**
- Target retirement income (monthly/annual)
- Legacy goals (leave inheritance?)
- Major planned expenses (home purchase, education, etc.)
- Desired retirement lifestyle description

The AI extracts structured parameters from natural language and confirms with the user before saving.

### 2.4 Model Selection (AI-Assisted)
The UI presents available models with visual explanations:

| Model | Description | Best For |
|-------|-------------|----------|
| **Monte Carlo Simulation** | Runs 1000+ randomized market scenarios to show probability distributions | Understanding range of outcomes |
| **Fixed Return Model** | Projects growth at a fixed annual return rate | Simple baseline projection |
| **Historical Backtesting** | Uses actual historical market data sequences | Seeing how past conditions affect plan |
| **Three-Scenario Model** | Best case / expected / worst case projections | Quick comparison of outcomes |

The AI recommends the best model based on user goals. Visual charts preview what each model output looks like.

### 2.5 Dashboard (Primary View)
**User information is FRONT AND CENTER:**

- **Header:** User name, age, years to retirement countdown
- **Key Metrics Cards:**
  - Current portfolio value
  - Monthly contribution
  - Projected retirement fund (median)
  - Probability of meeting goal
  - Retirement readiness score (0-100)

- **Primary Chart:** Portfolio growth projection over time
  - For Monte Carlo: Fan chart showing 10th/25th/50th/75th/90th percentiles
  - Goal line overlay showing target
  - Current progress marker

- **Secondary Views:**
  - Income vs expenses in retirement
  - Asset allocation breakdown
  - Savings rate trajectory

### 2.6 Model Comparison
- Side-by-side or overlay comparison of different models/scenarios
- "What-if" controls: adjust parameters and see real-time impact
  - Change retirement age slider
  - Change contribution amount
  - Change risk tolerance
  - Toggle Social Security on/off
- Track multiple scenarios simultaneously
- Clear visual indication of how each scenario tracks against goals

---

## 3. Technical Architecture

### 3.1 Frontend (React + Vite)
```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Router + layout shell
├── components/
│   ├── common/
│   │   ├── DisclaimerBanner.jsx    # Persistent top banner
│   │   ├── DisclaimerModal.jsx     # Login acknowledgment modal
│   │   ├── LoadingSpinner.jsx
│   │   └── Layout.jsx              # App shell with banner
│   ├── onboarding/
│   │   ├── OnboardingChat.jsx      # AI conversation interface
│   │   ├── ParameterConfirm.jsx    # Review extracted parameters
│   │   └── ProgressIndicator.jsx
│   ├── models/
│   │   ├── ModelSelector.jsx       # Visual model picker
│   │   ├── ModelCard.jsx           # Individual model preview
│   │   └── ModelComparison.jsx     # Side-by-side comparison
│   ├── dashboard/
│   │   ├── Dashboard.jsx           # Main dashboard layout
│   │   ├── MetricsCards.jsx        # Key financial metrics
│   │   ├── ProjectionChart.jsx     # Primary growth chart
│   │   ├── MonteCarloFan.jsx       # Fan chart for MC results
│   │   ├── ScenarioControls.jsx    # What-if parameter sliders
│   │   └── GoalTracker.jsx         # Progress toward goals
│   └── profile/
│       ├── UserProfile.jsx         # View/edit profile
│       └── FinancialSummary.jsx
├── hooks/
│   ├── useApi.js                   # API client hook
│   ├── useAuth.js                  # Session management
│   └── useDisclaimer.js            # Disclaimer state
├── utils/
│   ├── api.js                      # Generated API client from OpenAPI
│   ├── formatters.js               # Currency, date, percentage formatters
│   └── constants.js
└── styles/
    └── (Tailwind or CSS modules)
```

### 3.2 Backend (Cloudflare Pages Functions)
```
functions/
├── api/
│   ├── auth/
│   │   ├── login.js               # Create/resume session
│   │   └── session.js             # Validate session
│   ├── users/
│   │   ├── [id].js                # GET/PUT user profile
│   │   └── index.js               # POST create user
│   ├── financial-profile/
│   │   ├── [userId].js            # GET/PUT financial data
│   │   └── index.js               # POST create profile
│   ├── goals/
│   │   ├── [userId].js            # GET/PUT/DELETE goals
│   │   └── index.js               # POST create goal
│   ├── models/
│   │   ├── monte-carlo.js         # POST run Monte Carlo sim
│   │   ├── fixed-return.js        # POST run fixed return
│   │   ├── historical.js          # POST run historical backtest
│   │   ├── three-scenario.js      # POST run 3-scenario
│   │   └── compare.js             # POST compare multiple models
│   ├── scenarios/
│   │   ├── [userId].js            # GET saved scenarios
│   │   └── index.js               # POST save scenario
│   ├── ai/
│   │   └── chat.js                # POST conversational AI endpoint
│   └── greetings.js               # (legacy - keep for backward compat)
└── _middleware.js                  # CORS, session validation, error handling
```

### 3.3 Database Schema (D1)

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER NOT NULL,
  retirement_age INTEGER NOT NULL DEFAULT 65,
  risk_tolerance TEXT NOT NULL DEFAULT 'moderate', -- conservative/moderate/aggressive
  employment_status TEXT,
  disclaimer_acknowledged_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Financial profile
CREATE TABLE financial_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  annual_income REAL NOT NULL DEFAULT 0,
  current_savings REAL NOT NULL DEFAULT 0,
  monthly_contribution REAL NOT NULL DEFAULT 0,
  retirement_accounts_json TEXT,     -- JSON: {type, balance, contribution}[]
  social_security_monthly REAL DEFAULT 0,
  total_debt REAL DEFAULT 0,
  monthly_expenses REAL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- User goals
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  goal_type TEXT NOT NULL,           -- retirement_income, legacy, major_expense
  description TEXT,
  target_amount REAL,
  target_monthly_income REAL,
  target_date TEXT,
  priority INTEGER DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Saved simulation results / scenarios
CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  model_type TEXT NOT NULL,          -- monte_carlo, fixed_return, historical, three_scenario
  parameters_json TEXT NOT NULL,     -- Input parameters snapshot
  results_json TEXT NOT NULL,        -- Simulation output
  is_active INTEGER DEFAULT 0,       -- Currently tracked scenario
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Onboarding conversation history
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  messages_json TEXT NOT NULL,       -- [{role, content, timestamp}]
  status TEXT DEFAULT 'active',      -- active, completed
  extracted_params_json TEXT,        -- AI-extracted parameters
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);
```

### 3.4 Monte Carlo Simulation Engine

The core simulation runs **in the Pages Function** (server-side):

```
Inputs:
  - current_age, retirement_age
  - current_savings
  - monthly_contribution (may change over time)
  - expected_return (mean annual, based on risk tolerance)
  - return_std_dev (volatility, based on risk tolerance)
  - inflation_rate
  - retirement_monthly_spending
  - social_security_monthly
  - simulation_count (default: 1000)

Risk Profiles:
  Conservative: mean=6%, std=8%
  Moderate:     mean=8%, std=12%
  Aggressive:   mean=10%, std=16%

Algorithm:
  For each simulation (1..1000):
    For each year (current_age..95):
      if year < retirement_age:
        portfolio += monthly_contribution * 12
        portfolio *= (1 + random_normal(mean_return, std_dev))
      else:
        portfolio -= (retirement_spending - social_security) * 12
        portfolio *= (1 + random_normal(mean_return * 0.7, std_dev * 0.7))  // more conservative in retirement

Output:
  - percentile_paths: {10th, 25th, 50th, 75th, 90th} portfolio value by year
  - success_rate: % of simulations where money lasts to age 95
  - median_retirement_balance: at retirement age
  - worst_case_balance: 10th percentile at retirement
  - best_case_balance: 90th percentile at retirement
```

### 3.5 AI Integration

**Approach:** Use Anthropic Claude API (or OpenAI) via Pages Functions as a proxy.

**Onboarding Flow:**
1. System prompt defines the financial advisor persona and parameter extraction goals
2. User messages are sent to `/api/ai/chat`
3. Pages Function forwards to LLM API with conversation history
4. LLM responds conversationally AND returns structured parameter extractions
5. When all required parameters are collected, AI summarizes and confirms
6. Frontend displays extracted parameters for user review/edit

**Model Recommendation:**
- After parameters are collected, AI analyzes goals and recommends best model
- Explanation of why each model fits or doesn't fit their situation

**Environment Variable Required:**
- `ANTHROPIC_API_KEY` - Stored as Cloudflare Pages secret (NEVER in code)

---

## 4. OpenAPI Specification

See `docs/openapi.yaml` for the complete API contract.

---

## 5. Design Requirements (Lovable App Prompt)

See `docs/DESIGN_PROMPT.md` for the UI/UX design specification.

**Key Design Principles:**
- Financial trust aesthetic (blues, greens, clean typography)
- Data-dense but not overwhelming
- Mobile-responsive
- Accessibility (WCAG 2.1 AA)
- Charts must be colorblind-friendly
- User information prominently displayed at all times

---

## 6. Development Workflow

### 6.1 Parallel Agent Architecture
```
┌─────────────────────────────────┐
│       Orchestrator Agent        │
│  - Defines deliverables         │
│  - Validates completed work     │
│  - Manages merge to main        │
│  - Resolves merge conflicts     │
└──────┬──────────┬───────────────┘
       │          │
  ┌────▼────┐ ┌──▼──────────┐
  │ Agent A │ │  Agent B     │
  │ Backend │ │  Frontend    │
  │ API +   │ │  UI + Charts │
  │ Models  │ │  + Onboarding│
  │         │ │              │
  │ worktree│ │  worktree    │
  │ branch: │ │  branch:     │
  │ feat/api│ │  feat/ui     │
  └─────────┘ └──────────────┘
```

### 6.2 Branch Strategy
- `main` - Production (deploys to Cloudflare)
- `feat/api` - Backend API + models + database
- `feat/ui` - Frontend components + styling + charts
- Orchestrator merges feature branches → main when validated

### 6.3 Quality Gates (Per Commit)
- All tests passing
- Code coverage >= 90%
- Playwright E2E tests pass for frontend
- No secrets/keys in code (checked by pre-commit)
- Linting passes

### 6.4 Testing Strategy
- **Unit tests:** Vitest for utilities, simulation engine, API handlers
- **E2E tests:** Playwright for full user flows
- **Coverage tool:** vitest with c8/istanbul
- **Pre-commit hooks:** lint, test, coverage check

---

## 7. MVP Scope (1-Hour Hackathon)

### Must Have (P0)
- [ ] Database schema + migrations
- [ ] OpenAPI spec
- [ ] User creation + session management
- [ ] Financial profile CRUD
- [ ] Monte Carlo simulation engine
- [ ] AI-guided onboarding chat
- [ ] Dashboard with projection chart
- [ ] Disclaimer modal + banner
- [ ] Key metrics cards
- [ ] Responsive, polished UI

### Should Have (P1)
- [ ] Model comparison view
- [ ] What-if scenario controls (sliders)
- [ ] Multiple model types (fixed return, 3-scenario)
- [ ] Goal tracking visualization
- [ ] Save/load scenarios

### Nice to Have (P2)
- [ ] Historical backtesting model
- [ ] PDF export of retirement plan
- [ ] Email summary
- [ ] Dark mode

---

## 8. Dependencies & Secrets

### NPM Packages to Add
- `chart.js` + `react-chartjs-2` - Charts and visualizations
- `tailwindcss` - Utility-first CSS
- `uuid` - ID generation
- `zod` - Schema validation (shared frontend/backend)

### Cloudflare Secrets (NEVER in code)
- `ANTHROPIC_API_KEY` - Claude API key for onboarding AI
- Existing: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

### GitHub Secrets
- All of the above for CI/CD
