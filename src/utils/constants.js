export const PROJECT_COLORS = [
  { name: 'Red', value: '#ef4444', className: 'project-red' },
  { name: 'Orange', value: '#f97316', className: 'project-orange' },
  { name: 'Blue', value: '#3b82f6', className: 'project-blue' },
  { name: 'Green', value: '#22c55e', className: 'project-green' },
  { name: 'Purple', value: '#8b5cf6', className: 'project-purple' },
  { name: 'Pink', value: '#ec4899', className: 'project-pink' },
  { name: 'Teal', value: '#14b8a6', className: 'project-teal' },
  { name: 'Yellow', value: '#facc15', className: 'project-yellow' },
  { name: 'Lime', value: '#a3e635', className: 'project-lime' },
  { name: 'Cyan', value: '#22d3ee', className: 'project-cyan' },
  { name: 'Indigo', value: '#6366f1', className: 'project-indigo' },
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Weekend'];

export const INITIAL_PROJECT_DATA = [
  {
    id: 'project-1',
    title: 'TODAY - Urgent Tasks',
    type: 'project',
    color: PROJECT_COLORS[0].value,
    children: [
      { id: 'task-1', title: 'Reach out to non-participating F3 SPs', type: 'task', projectId: 'project-1', projectColor: PROJECT_COLORS[0].value },
      { id: 'task-2', title: 'Add Filecoin docs', type: 'task', projectId: 'project-1', projectColor: PROJECT_COLORS[0].value },
      { id: 'task-3', title: 'Create RTs and quotes', type: 'task', projectId: 'project-1', projectColor: PROJECT_COLORS[0].value },
    ]
  },
  {
    id: 'project-2',
    title: 'SPX Project',
    type: 'project',
    color: PROJECT_COLORS[1].value,
    children: [
      { id: 'task-11', title: 'Start planning assignments', type: 'task', projectId: 'project-2', projectColor: PROJECT_COLORS[1].value },
    ]
  },
   {
    id: 'project-3',
    title: 'TO SCHEDULE',
    type: 'project',
    color: PROJECT_COLORS[2].value,
    children: [
      { id: 'task-16', title: 'Push Jen on LIT', type: 'task', projectId: 'project-3', projectColor: PROJECT_COLORS[2].value },
    ]
  },
];
