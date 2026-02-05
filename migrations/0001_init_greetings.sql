-- Migration: Initialize greetings table
-- Description: Creates the greetings table for storing user messages

DROP TABLE IF EXISTS greetings;

CREATE TABLE greetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL
);

-- Insert sample data
-- Note: Timestamps are relative to migration execution time
INSERT INTO greetings (message, created_at) VALUES 
  ('Hello from Cloudflare D1!', datetime('now')),
  ('Welcome to our serverless app', datetime('now', '-1 hour'));
