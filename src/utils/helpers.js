import { PROJECT_COLORS } from './constants';

export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const daysAgo = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hoursAgo = Math.floor(diff / (1000 * 60 * 60));
  const minutesAgo = Math.floor(diff / (1000 * 60));

  if (daysAgo > 0) return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
  if (hoursAgo > 0) return `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
  if (minutesAgo > 0) return `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
  return 'Just now';
};

export const getProjectTitleFromDefinitions = (projectId, projectDefinitions) => {
  const project = projectDefinitions.find(p => p.id === projectId);
  return project ? project.title : 'Unknown Project';
};

export const getProjectColorClass = (colorValue) => {
  const colorObj = PROJECT_COLORS.find(c => c.value === colorValue);
  return colorObj ? colorObj.className : '';
};

export const findTaskLocationInTasks = (taskId, tasksState) => {
  for (const [containerName, containerTasks] of Object.entries(tasksState)) {
    const taskIndex = containerTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) return { container: containerName, index: taskIndex };
  }
  return null;
};
