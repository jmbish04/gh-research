CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  prompt TEXT,
  status TEXT CHECK(status IN ('running','complete')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  report_url TEXT
);

CREATE TABLE findings (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  repo_url TEXT,
  relevance_score REAL,
  summary TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
