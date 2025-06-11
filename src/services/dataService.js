import apiService from './api.js';

class DataService {
  constructor() {
    this.cache = null;
    this.lastSync = null;
  }

  // Initialize and load all data
  async initializeData() {
    try {
      const data = await apiService.getAllData();
      this.cache = data;
      this.lastSync = Date.now();
      return data;
    } catch (error) {
      console.error('Failed to initialize data:', error);
      throw new Error('Could not connect to server. Please check your connection and try again.');
    }
  }

  // Get cached data or fetch from API
  async getAllData() {
    if (!this.cache || this.shouldRefresh()) {
      return await this.initializeData();
    }
    return this.cache;
  }

  shouldRefresh() {
    // Refresh if no data or last sync was more than 5 minutes ago
    return !this.lastSync || (Date.now() - this.lastSync) > 5 * 60 * 1000;
  }

  // Projects
  async createProject(project) {
    try {
      const result = await apiService.createProject(project);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  async updateProject(id, updates) {
    try {
      const result = await apiService.updateProject(id, updates);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }

  async deleteProject(id) {
    try {
      const result = await apiService.deleteProject(id);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  async reorderProjects(projectIds) {
    try {
      const result = await apiService.reorderProjects(projectIds);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to reorder projects:', error);
      throw error;
    }
  }

  // Tasks
  async createTask(task) {
    try {
      const result = await apiService.createTask(task);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(id, updates) {
    try {
      const result = await apiService.updateTask(id, updates);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  async moveTask(id, moveData) {
    try {
      const result = await apiService.moveTask(id, moveData);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to move task:', error);
      throw error;
    }
  }

  async completeTask(id) {
    try {
      const result = await apiService.completeTask(id);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to complete task:', error);
      throw error;
    }
  }

  async deleteTask(id) {
    try {
      const result = await apiService.deleteTask(id);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  async restoreTask(taskId) {
    try {
      const result = await apiService.restoreTask(taskId);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to restore task:', error);
      throw error;
    }
  }

  async getCompletedTasks() {
    try {
      return await apiService.getCompletedTasks();
    } catch (error) {
      console.error('Failed to get completed tasks:', error);
      throw error;
    }
  }

  async getDeletedTasks() {
    try {
      return await apiService.getDeletedTasks();
    } catch (error) {
      console.error('Failed to get deleted tasks:', error);
      throw error;
    }
  }

  // Cache management
  invalidateCache() {
    this.cache = null;
    this.lastSync = null;
  }

  // For migration from localStorage
  async importData(data) {
    try {
      const result = await apiService.importData(data);
      this.invalidateCache();
      return result;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }
}

export default new DataService();