import express from 'express';
import { google } from 'googleapis';
import pool from '../database/connection.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

class GoogleDriveService {
  constructor() {
    this.auth = null;
    this.drive = null;
  }

  async initialize() {
    try {
      const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json';
      const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
      
      // Check if it's a service account or OAuth credentials
      if (credentials.type === 'service_account') {
        // Service Account flow
        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.metadata.readonly'
          ]
        });
      } else {
        // OAuth 2.0 flow - handle both formats
        const oauth_creds = credentials.web || credentials;
        const { client_id, client_secret, refresh_token } = oauth_creds;
        
        this.auth = new google.auth.OAuth2(
          client_id,
          client_secret,
          'http://localhost:3001/api/gdrive/oauth/callback'
        );
        
        if (refresh_token) {
          this.auth.setCredentials({ refresh_token });
        } else {
          console.log('No refresh token found. Need to authenticate first.');
          return false;
        }
      }
      
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      return false;
    }
  }

  async scanFiles(lookbackHours = 36) {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    const lookbackTime = new Date();
    lookbackTime.setHours(lookbackTime.getHours() - lookbackHours);
    const lookbackISO = lookbackTime.toISOString();

    try {
      // Get all shared drives first
      const drivesResponse = await this.drive.drives.list({
        pageSize: 100
      });
      
      const sharedDriveIds = (drivesResponse.data.drives || []).map(drive => drive.id);
      
      if (sharedDriveIds.length === 0) {
        console.log('No shared drives found');
        return [];
      }

      // Get all files from shared drives with driveId field for better filtering
      const allDrivesResponse = await this.drive.files.list({
        q: `modifiedTime > '${lookbackISO}' and trashed = false`,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,parents,driveId)',
        orderBy: 'modifiedTime desc',
        pageSize: 1000,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        corpora: 'allDrives'
      });

      const sharedResponse = allDrivesResponse;

      const files = sharedResponse.data.files || [];
      console.log(`Found ${files.length} total files, will check paths for shared drives`);
      
      // Create shared drives lookup map
      let sharedDrives = {};
      (drivesResponse.data.drives || []).forEach(drive => {
        sharedDrives[drive.id] = drive.name;
      });

      // Filter files that belong to shared drives using driveId first (much faster)
      const sharedDriveFiles = [];
      const filesToTraverse = [];
      
      // All files need full path traversal to get complete hierarchy
      for (const file of files) {
        if (file.parents && file.parents.length > 0) {
          // All files with parents need path traversal
          filesToTraverse.push(file);
        } else if (file.driveId && sharedDrives[file.driveId]) {
          // Files directly in shared drive root (no parents)
          file.sharedDriveName = sharedDrives[file.driveId];
          file.fullPath = [sharedDrives[file.driveId], file.name];
          file.pathString = file.fullPath.join(' > ');
          sharedDriveFiles.push(file);
        }
      }
      
      // Second pass: only traverse files that don't have driveId set
      if (filesToTraverse.length > 0) {
        // Batch fetch ALL folder hierarchy in one API call  
        
        // Get ALL folders from shared drives to build complete hierarchy
        const allFoldersResponse = await this.drive.files.list({
          q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: 'files(id,name,parents,driveId)',
          pageSize: 1000,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true
        });
        
        // Build complete folder hierarchy cache
        const parentInfoCache = {};
        
        // Add shared drives to cache
        Object.keys(sharedDrives).forEach(driveId => {
          parentInfoCache[driveId] = { 
            name: sharedDrives[driveId], 
            isSharedDriveRoot: true 
          };
        });
        
        // Add all folders to cache
        (allFoldersResponse.data.files || []).forEach(folder => {
          parentInfoCache[folder.id] = {
            name: folder.name,
            parents: folder.parents,
            driveId: folder.driveId
          };
        });
        
        
        // Now traverse with cached parent info
        for (const file of filesToTraverse) {
          let currentParentId = file.parents[0];
          let maxDepth = 10; // Increased depth for complete paths
          const pathElements = [];
          let belongsToSharedDrive = false;
          
          while (currentParentId && maxDepth > 0) {
            const parentInfo = parentInfoCache[currentParentId];
            if (!parentInfo) break;
            
            // Check if current parent is a shared drive root
            if (sharedDrives[currentParentId] || parentInfo.isSharedDriveRoot) {
              file.sharedDriveName = sharedDrives[currentParentId] || parentInfo.name;
              pathElements.unshift(file.sharedDriveName);
              belongsToSharedDrive = true;
              break;
            }
            
            pathElements.unshift(parentInfo.name);
            
            if (parentInfo.parents && parentInfo.parents.length > 0) {
              currentParentId = parentInfo.parents[0];
            } else {
              break; // Reached root without finding shared drive
            }
            
            maxDepth--;
          }
          
          // ONLY include files that belong to shared drives
          if (belongsToSharedDrive) {
            pathElements.push(file.name); // Add the file name to the end
            file.fullPath = pathElements;
            file.pathString = pathElements.join(' > ');
            sharedDriveFiles.push(file);
          }
        }
      }
      
      console.log(`Kept ${sharedDriveFiles.length} files that belong to shared drives (excluded ${files.length - sharedDriveFiles.length} non-shared-drive files)`);
      
      return sharedDriveFiles;
    } catch (error) {
      console.error('Error scanning Google Drive files:', error);
      throw error;
    }
  }

  async syncFiles(lookbackHours = 36) {
    const client = await pool.connect();
    let syncLogId = null;
    
    try {
      await client.query('BEGIN');
      
      // Create sync log entry
      const logResult = await client.query(
        'INSERT INTO gdrive_sync_log (lookback_hours, status) VALUES ($1, $2) RETURNING id',
        [lookbackHours, 'running']
      );
      syncLogId = logResult.rows[0].id;

      const lookbackTime = new Date();
      lookbackTime.setHours(lookbackTime.getHours() - lookbackHours);

      // Get all files currently in our database
      const existingFiles = await client.query(
        'SELECT file_id FROM gdrive_files WHERE status = $1',
        ['active']
      );
      const existingFileIds = new Set(existingFiles.rows.map(row => row.file_id));

      // Scan for files modified in lookback period
      const files = await this.scanFiles(lookbackHours);
      const scannedFileIds = new Set(files.map(file => file.id));
      
      let changesDetected = 0;
      const changes = {
        added: [],
        modified: [],
        deleted: []
      };

      // Process scanned files (added or modified)
      for (const file of files) {
        const existingFile = await client.query(
          'SELECT * FROM gdrive_files WHERE file_id = $1',
          [file.id]
        );

        const fileData = {
          file_id: file.id,
          name: file.name,
          mime_type: file.mimeType,
          size: file.size ? parseInt(file.size) : null,
          modified_time: file.modifiedTime,
          web_view_link: file.webViewLink,
          download_link: `https://drive.google.com/uc?id=${file.id}`,
          shared_drive_name: file.sharedDriveName || null,
          full_path: file.pathString || null
        };

        if (existingFile.rows.length === 0) {
          // New file (added)
          await client.query(
            `INSERT INTO gdrive_files 
             (file_id, name, mime_type, size, modified_time, web_view_link, download_link, shared_drive_name, full_path) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [fileData.file_id, fileData.name, fileData.mime_type, 
             fileData.size, fileData.modified_time, fileData.web_view_link, fileData.download_link, fileData.shared_drive_name, fileData.full_path]
          );
          changes.added.push(fileData.name);
          changesDetected++;
        } else {
          // Check if file was modified
          const existing = existingFile.rows[0];
          if (new Date(file.modifiedTime) > new Date(existing.modified_time)) {
            await client.query(
              `UPDATE gdrive_files 
               SET name = $1, mime_type = $2, size = $3, modified_time = $4, 
                   web_view_link = $5, download_link = $6, shared_drive_name = $7, full_path = $8, last_synced = CURRENT_TIMESTAMP
               WHERE file_id = $9`,
              [fileData.name, fileData.mime_type, fileData.size, 
               fileData.modified_time, fileData.web_view_link, fileData.download_link, fileData.shared_drive_name, fileData.full_path, fileData.file_id]
            );
            changes.modified.push(fileData.name);
            changesDetected++;
          }
        }
      }

      // Check for deleted files (files in our DB but not in Google Drive)
      // Only check files that were last synced before lookback time
      const potentiallyDeleted = await client.query(
        `SELECT file_id, name FROM gdrive_files 
         WHERE status = 'active' AND last_synced < $1`,
        [lookbackTime.toISOString()]
      );

      for (const dbFile of potentiallyDeleted.rows) {
        if (!scannedFileIds.has(dbFile.file_id)) {
          // File exists in our DB but not found in Google Drive scan
          // Verify it's actually deleted by checking if it exists
          try {
            await this.drive.files.get({ fileId: dbFile.file_id });
          } catch (error) {
            if (error.code === 404) {
              // File is actually deleted
              await client.query(
                'UPDATE gdrive_files SET status = $1, last_synced = CURRENT_TIMESTAMP WHERE file_id = $2',
                ['deleted', dbFile.file_id]
              );
              changes.deleted.push(dbFile.name);
              changesDetected++;
            }
          }
        }
      }

      // Update sync log with detailed results
      await client.query(
        `UPDATE gdrive_sync_log 
         SET files_scanned = $1, changes_detected = $2, status = $3,
             export_file_path = $4
         WHERE id = $5`,
        [files.length, changesDetected, 'completed', 
         JSON.stringify(changes), syncLogId]
      );

      await client.query('COMMIT');
      
      return {
        filesScanned: files.length,
        changesDetected,
        changes,
        syncLogId
      };

    } catch (error) {
      await client.query('ROLLBACK');
      
      if (syncLogId) {
        await client.query(
          'UPDATE gdrive_sync_log SET status = $1, error_message = $2 WHERE id = $3',
          ['failed', error.message, syncLogId]
        );
      }
      
      throw error;
    } finally {
      client.release();
    }
  }

  async generateClaudeExport(lookbackHours = 36) {
    try {
      const lookbackTime = new Date();
      lookbackTime.setHours(lookbackTime.getHours() - lookbackHours);

      // Get recently modified files
      const modifiedResult = await pool.query(
        `SELECT * FROM gdrive_files 
         WHERE modified_time > $1 AND status = 'active'
         ORDER BY modified_time DESC`,
        [lookbackTime.toISOString()]
      );

      // Get recently deleted files
      const deletedResult = await pool.query(
        `SELECT * FROM gdrive_files 
         WHERE updated_at > $1 AND status = 'deleted'
         ORDER BY updated_at DESC`,
        [lookbackTime.toISOString()]
      );

      // Get latest sync log for change summary
      const syncLogResult = await pool.query(
        'SELECT * FROM gdrive_sync_log ORDER BY sync_time DESC LIMIT 1'
      );

      const activeFiles = modifiedResult.rows;
      const deletedFiles = deletedResult.rows;
      const lastSync = syncLogResult.rows[0];
      
      let changes = { added: [], modified: [], deleted: [] };
      if (lastSync && lastSync.export_file_path) {
        try {
          changes = JSON.parse(lastSync.export_file_path);
        } catch (e) {
          // export_file_path contains file path, not changes
        }
      }

      const exportData = {
        exportTime: new Date().toISOString(),
        lookbackHours,
        summary: {
          totalActiveFiles: activeFiles.length,
          totalDeletedFiles: deletedFiles.length,
          changesInPeriod: {
            added: changes.added?.length || 0,
            modified: changes.modified?.length || 0,
            deleted: changes.deleted?.length || 0
          },
          fileTypes: this.groupFilesByType(activeFiles),
          sizeDistribution: this.calculateSizeDistribution(activeFiles)
        },
        changes: {
          added: changes.added || [],
          modified: changes.modified || [],
          deleted: changes.deleted || []
        },
        files: {
          active: activeFiles.map(file => ({
            name: file.name,
            type: file.mime_type,
            size: file.size,
            modifiedTime: file.modified_time,
            webViewLink: file.web_view_link,
            downloadLink: file.download_link,
            sharedDrive: file.shared_drive_name,
            fullPath: file.full_path,
            status: 'active'
          })),
          deleted: deletedFiles.map(file => ({
            name: file.name,
            type: file.mime_type,
            size: file.size,
            deletedTime: file.updated_at,
            sharedDrive: file.shared_drive_name,
            fullPath: file.full_path,
            status: 'deleted'
          }))
        }
      };

      return { exportData };
    } catch (error) {
      console.error('Error generating Claude export:', error);
      throw error;
    }
  }

  groupFilesByType(files) {
    return files.reduce((acc, file) => {
      const type = file.mime_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  calculateSizeDistribution(files) {
    const sizes = files.filter(f => f.size).map(f => f.size);
    if (sizes.length === 0) return null;
    
    return {
      total: sizes.reduce((a, b) => a + b, 0),
      average: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
      largest: Math.max(...sizes),
      smallest: Math.min(...sizes)
    };
  }
}

const gdriveService = new GoogleDriveService();

// Test Google Drive connection
router.get('/test', async (req, res) => {
  try {
    const initialized = await gdriveService.initialize();
    if (!initialized) {
      return res.status(500).json({ 
        error: 'Failed to initialize Google Drive service',
        details: 'Check credentials file and permissions'
      });
    }

    // Try to list a few files to test the connection
    const files = await gdriveService.scanFiles(1); // Last 1 hour
    
    res.json({ 
      message: 'Google Drive connection successful',
      filesFound: files.length,
      serviceAccount: process.env.GOOGLE_CREDENTIALS_PATH ? 'configured' : 'not configured'
    });
  } catch (error) {
    console.error('Google Drive test failed:', error);
    res.status(500).json({ 
      error: 'Google Drive test failed',
      details: error.message
    });
  }
});

// Debug shared drives
router.get('/debug/drives', async (req, res) => {
  try {
    const initialized = await gdriveService.initialize();
    if (!initialized) {
      return res.status(500).json({ error: 'Service not initialized' });
    }

    // List all shared drives
    const drivesResponse = await gdriveService.drive.drives.list({
      pageSize: 100
    });
    
    res.json({
      drives: drivesResponse.data.drives || [],
      count: drivesResponse.data.drives ? drivesResponse.data.drives.length : 0
    });
  } catch (error) {
    console.error('Debug drives failed:', error);
    res.status(500).json({ 
      error: 'Failed to list drives',
      details: error.message
    });
  }
});

// Initialize Google Drive connection
router.post('/initialize', async (req, res) => {
  try {
    const success = await gdriveService.initialize();
    if (success) {
      res.json({ message: 'Google Drive service initialized successfully' });
    } else {
      res.status(500).json({ error: 'Failed to initialize Google Drive service' });
    }
  } catch (error) {
    console.error('Error initializing Google Drive:', error);
    res.status(500).json({ error: 'Failed to initialize Google Drive service' });
  }
});

// Scan and sync files
router.post('/sync', async (req, res) => {
  try {
    const { lookbackHours = 36 } = req.body;
    
    if (!gdriveService.drive) {
      const initialized = await gdriveService.initialize();
      if (!initialized) {
        return res.status(500).json({ error: 'Google Drive service not available' });
      }
    }

    const result = await gdriveService.syncFiles(lookbackHours);
    res.json(result);
  } catch (error) {
    console.error('Error syncing Google Drive files:', error);
    res.status(500).json({ error: 'Failed to sync Google Drive files' });
  }
});

// Get recent files
router.get('/files', async (req, res) => {
  try {
    const { hours = 36, limit = 100 } = req.query;
    const lookbackTime = new Date();
    lookbackTime.setHours(lookbackTime.getHours() - parseInt(hours));

    const result = await pool.query(
      `SELECT * FROM gdrive_files 
       WHERE modified_time > $1 AND status = 'active'
       ORDER BY modified_time DESC
       LIMIT $2`,
      [lookbackTime.toISOString(), parseInt(limit)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching Google Drive files:', error);
    res.status(500).json({ error: 'Failed to fetch Google Drive files' });
  }
});

// Generate Claude AI export (download)
router.get('/export/download', async (req, res) => {
  try {
    const { lookbackHours = 36 } = req.query;
    const result = await gdriveService.generateClaudeExport(parseInt(lookbackHours));
    
    // Force download with proper headers
    const filename = `gdrive-export-${Date.now()}.json`;
    
    res.setHeader('Content-Type', 'application/force-download');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(JSON.stringify(result.exportData, null, 2));
    
  } catch (error) {
    console.error('Error generating export:', error);
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

// Generate Claude AI export (JSON response)
router.post('/export', async (req, res) => {
  try {
    const { lookbackHours = 36 } = req.body;
    const result = await gdriveService.generateClaudeExport(lookbackHours);
    
    res.json({
      message: 'Export generated successfully',
      summary: result.exportData.summary,
      downloadUrl: `/api/gdrive/export/download?lookbackHours=${lookbackHours}`
    });
    
  } catch (error) {
    console.error('Error generating export:', error);
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

// Get sync history
router.get('/sync-history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM gdrive_sync_log ORDER BY sync_time DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sync history:', error);
    res.status(500).json({ error: 'Failed to fetch sync history' });
  }
});

// OAuth authentication flow
router.get('/auth', async (req, res) => {
  try {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json';
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
    
    // Handle both formats
    const oauth_creds = credentials.web || credentials;
    
    const oauth2Client = new google.auth.OAuth2(
      oauth_creds.client_id,
      oauth_creds.client_secret,
      'http://localhost:3001/api/gdrive/oauth/callback'
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ],
      prompt: 'consent'
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

// OAuth callback
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('No authorization code received');
    }

    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json';
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
    
    // Handle both formats
    const oauth_creds = credentials.web || credentials;
    
    const oauth2Client = new google.auth.OAuth2(
      oauth_creds.client_id,
      oauth_creds.client_secret,
      'http://localhost:3001/api/gdrive/oauth/callback'
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // Save the refresh token to credentials file
    if (credentials.web) {
      credentials.web.refresh_token = tokens.refresh_token;
    } else {
      credentials.refresh_token = tokens.refresh_token;
    }
    await fs.writeFile(credentialsPath, JSON.stringify(credentials, null, 2));
    
    res.send(`
      <html>
        <body>
          <h2>✅ Google Drive Authentication Successful!</h2>
          <p>You can now close this window and return to your app.</p>
          <p>The Google Drive scan functionality is now ready to use.</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h2>❌ Authentication Failed</h2>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

export default router;