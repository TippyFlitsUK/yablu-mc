const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async createProject(project) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id, updates) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderProjects(projectIds) {
    return this.request('/projects/reorder', {
      method: 'POST',
      body: JSON.stringify({ projectIds }),
    });
  }

  // Tasks
  async getTasks() {
    return this.request('/tasks');
  }

  async createTask(task) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id, updates) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async moveTask(id, moveData) {
    return this.request(`/tasks/${id}/move`, {
      method: 'POST',
      body: JSON.stringify(moveData),
    });
  }

  async completeTask(id) {
    return this.request(`/tasks/${id}/complete`, {
      method: 'POST',
    });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async getCompletedTasks() {
    return this.request('/tasks/completed');
  }

  async getDeletedTasks() {
    return this.request('/tasks/deleted');
  }

  async restoreTask(taskId) {
    return this.request(`/tasks/restore/${taskId}`, {
      method: 'POST',
    });
  }

  // Sync
  async getAllData() {
    return this.request('/sync/all');
  }

  async importData(data) {
    return this.request('/sync/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Google Drive
  async initializeGoogleDrive() {
    return this.request('/gdrive/initialize', {
      method: 'POST',
    });
  }

  async syncGoogleDrive(lookbackHours = 36) {
    return this.request('/gdrive/sync', {
      method: 'POST',
      body: JSON.stringify({ lookbackHours }),
    });
  }

  async getGoogleDriveFiles(hours = 36, limit = 100) {
    return this.request(`/gdrive/files?hours=${hours}&limit=${limit}`);
  }

  async exportGoogleDriveForClaude(lookbackHours = 36) {
    return this.request('/gdrive/export', {
      method: 'POST',
      body: JSON.stringify({ lookbackHours }),
    });
  }

  async getGoogleDriveSyncHistory() {
    return this.request('/gdrive/sync-history');
  }
}

export default new ApiService();