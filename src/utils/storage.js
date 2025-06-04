export const STORAGE_KEYS = {
  TASKS: 'yablu-mc-tasks',
  DELETED_TASKS: 'yablu-mc-deleted-tasks',
  COMPLETED_TASKS: 'yablu-mc-completed-tasks',
  PROJECT_DEFINITIONS: 'yablu-mc-project-definitions'
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  }
};
