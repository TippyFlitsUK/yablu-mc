-- Google Drive integration tables migration

-- Create gdrive_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS gdrive_files (
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

-- Create gdrive_sync_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS gdrive_sync_log (
  id SERIAL PRIMARY KEY,
  sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  files_scanned INTEGER DEFAULT 0,
  changes_detected INTEGER DEFAULT 0,
  export_file_path TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  error_message TEXT,
  lookback_hours INTEGER DEFAULT 36
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_gdrive_files_file_id ON gdrive_files(file_id);
CREATE INDEX IF NOT EXISTS idx_gdrive_files_modified_time ON gdrive_files(modified_time);
CREATE INDEX IF NOT EXISTS idx_gdrive_files_status ON gdrive_files(status);
CREATE INDEX IF NOT EXISTS idx_gdrive_sync_log_sync_time ON gdrive_sync_log(sync_time);

-- Create update timestamp trigger for gdrive_files if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gdrive_files_updated_at') THEN
    CREATE TRIGGER update_gdrive_files_updated_at BEFORE UPDATE ON gdrive_files
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;