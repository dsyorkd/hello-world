-- RetireWise database schema
-- Migration: 0002_retirewise_schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER NOT NULL,
  retirement_age INTEGER NOT NULL DEFAULT 65,
  risk_tolerance TEXT NOT NULL DEFAULT 'moderate',
  employment_status TEXT,
  disclaimer_acknowledged_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Financial profile
CREATE TABLE IF NOT EXISTS financial_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  annual_income REAL NOT NULL DEFAULT 0,
  current_savings REAL NOT NULL DEFAULT 0,
  monthly_contribution REAL NOT NULL DEFAULT 0,
  retirement_accounts_json TEXT,
  social_security_monthly REAL DEFAULT 0,
  total_debt REAL DEFAULT 0,
  monthly_expenses REAL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- User goals
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  goal_type TEXT NOT NULL,
  description TEXT,
  target_amount REAL,
  target_monthly_income REAL,
  target_date TEXT,
  priority INTEGER DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Saved simulation scenarios
CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  model_type TEXT NOT NULL,
  parameters_json TEXT NOT NULL,
  results_json TEXT NOT NULL,
  is_active INTEGER DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- AI onboarding conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  messages_json TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  extracted_params_json TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_profiles_user_id ON financial_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
