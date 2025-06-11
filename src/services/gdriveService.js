import apiService from './api.js';

class GoogleDriveService {
  constructor() {
    this.initialized = false;
    this.lastSync = null;
  }

  async initialize() {
    try {
      await apiService.initializeGoogleDrive();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      this.initialized = false;
      return false;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      return await this.initialize();
    }
    return true;
  }

  async syncFiles(lookbackHours = 36) {
    try {
      if (!(await this.ensureInitialized())) {
        throw new Error('Google Drive service not initialized');
      }

      const result = await apiService.syncGoogleDrive(lookbackHours);
      this.lastSync = Date.now();
      return result;
    } catch (error) {
      console.error('Failed to sync Google Drive files:', error);
      throw error;
    }
  }

  async getRecentFiles(hours = 36, limit = 100) {
    try {
      return await apiService.getGoogleDriveFiles(hours, limit);
    } catch (error) {
      console.error('Failed to get Google Drive files:', error);
      throw error;
    }
  }

  async exportForClaude(lookbackHours = 36) {
    try {
      // Create a temporary link to trigger download
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const downloadUrl = `${API_BASE_URL}/gdrive/export/download?lookbackHours=${lookbackHours}`;
      
      // Create a temporary anchor element and click it to force download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `gdrive-export-${Date.now()}.json`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { message: 'Download started' };
    } catch (error) {
      console.error('Failed to export Google Drive data for Claude:', error);
      throw error;
    }
  }

  async getSyncHistory() {
    try {
      return await apiService.getGoogleDriveSyncHistory();
    } catch (error) {
      console.error('Failed to get sync history:', error);
      throw error;
    }
  }

  async autoSync() {
    try {
      const result = await this.syncFiles();
      if (result.changesDetected > 0) {
        return await this.exportForClaude();
      }
      return null;
    } catch (error) {
      console.error('Auto sync failed:', error);
      throw error;
    }
  }

  getLastSyncTime() {
    return this.lastSync;
  }

  isInitialized() {
    return this.initialized;
  }
}

export default new GoogleDriveService();