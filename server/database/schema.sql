-- YABLU-MC Database Schema

-- Projects table
CREATE TABLE projects (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table  
CREATE TABLE tasks (
  id VARCHAR(50) PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  container VARCHAR(20) NOT NULL DEFAULT 'master', -- 'master', 'monday', 'tuesday', etc.
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deleted tasks (soft delete with restore capability)
CREATE TABLE deleted_tasks (
  id SERIAL PRIMARY KEY,
  task_data JSONB NOT NULL,
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  original_container VARCHAR(20),
  original_index INTEGER
);

-- Completed tasks
CREATE TABLE completed_tasks (
  id SERIAL PRIMARY KEY,
  task_data JSONB NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  original_container VARCHAR(20),
  original_index INTEGER
);

-- Indexes for performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_container ON tasks(container);
CREATE INDEX idx_tasks_order ON tasks(container, order_index);
CREATE INDEX idx_deleted_tasks_deleted_at ON deleted_tasks(deleted_at);
CREATE INDEX idx_completed_tasks_completed_at ON completed_tasks(completed_at);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Google Drive integration tables
CREATE TABLE gdrive_files (
  id SERIAL PRIMARY KEY,
  file_id VARCHAR(255) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  mime_type VARCHAR(255),
  size BIGINT,
  modified_time TIMESTAMP,
  web_view_link TEXT,
  download_link TEXT,
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gdrive_sync_log (
  id SERIAL PRIMARY KEY,
  sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  files_scanned INTEGER DEFAULT 0,
  changes_detected INTEGER DEFAULT 0,
  export_file_path TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  error_message TEXT,
  lookback_hours INTEGER DEFAULT 36
);

-- Indexes for Google Drive tables
CREATE INDEX idx_gdrive_files_file_id ON gdrive_files(file_id);
CREATE INDEX idx_gdrive_files_modified_time ON gdrive_files(modified_time);
CREATE INDEX idx_gdrive_files_status ON gdrive_files(status);
CREATE INDEX idx_gdrive_sync_log_sync_time ON gdrive_sync_log(sync_time);

-- Update timestamp trigger for gdrive_files
CREATE TRIGGER update_gdrive_files_updated_at BEFORE UPDATE ON gdrive_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();