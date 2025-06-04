import { useState, useEffect } from 'react';
// Removed DndContext and related imports from @dnd-kit
import { Edit2, Trash2, X, RotateCcw, Trash, Check, CheckCircle, AlertTriangle, PlusCircle, GripVertical } from 'lucide-react';
import './App.css';

// Define available project colors
const PROJECT_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Yellow', value: '#facc15' },
  { name: 'Lime', value: '#a3e635' },
  { name: 'Cyan', value: '#22d3ee' },
  { name: 'Indigo', value: '#6366f1' },
];

// Real task data from user's current list
const initialProjectData = [
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


const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Weekend'];

// Color mapping helper
const getProjectClass = (colorValue) => {
  const colorObj = PROJECT_COLORS.find(c => c.value === colorValue);
  if (colorObj) {
    return `project-${colorObj.name.toLowerCase()}`;
  }
  const legacyColorMap = {
    '#ef4444': 'project-red',
    '#22c55e': 'project-green', 
    '#3b82f6': 'project-blue',
    '#f97316': 'project-orange'
  };
  return legacyColorMap[colorValue] || '';
};

// Project Header Component (No longer Sortable)
function ProjectHeader({ project, onContextMenu }) {
  // Removed useSortable and related props/styles
  return (
    <div
      className={`project-header ${getProjectClass(project.color)}`}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, project) : undefined}
    >
      <div className="project-title-container">
         {/* Removed drag handle */}
        <div className="project-title">{project.title}</div>
      </div>
    </div>
  );
}

// Task Card Component (No longer Sortable)
function TaskCard({ task, onContextMenu }) {
  // Removed useSortable and related props/styles
  const isSubTask = task.type === 'task' && task.projectId;
  const projectClass = getProjectClass(task.projectColor);

  return (
    <div
      onContextMenu={(e) => onContextMenu(e, task)}
      className={`task-card ${isSubTask ? 'sub-task' : ''} ${projectClass}`}
    >
      <div className="task-title">{task.title}</div>
    </div>
  );
}


// Generic Context Menu Component
function AppContextMenu({ menuData, actions, onClose }) {
  if (!menuData.visible) return null;

  return (
    <div
      className="context-menu"
      style={{ top: menuData.y, left: menuData.x }}
      onClick={(e) => e.stopPropagation()} 
    >
      {actions.map(action => (
        <button
          key={action.label}
          onClick={() => {
            action.handler(menuData.item);
            onClose();
          }}
          className={`context-menu-btn ${action.className || ''}`}
        >
          {action.icon} {action.label}
        </button>
      ))}
    </div>
  );
}


// Completed Tasks Modal Component
function CompletedTasksModal({ completedTasks, onMarkIncomplete, onClose, projectDefinitions }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (timestamp) => {
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

  const getProjectTitle = (projectId) => {
    const project = projectDefinitions.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  };

  const sortedTasks = completedTasks.sort((a, b) => b.completedAt - a.completedAt);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content completed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Completed Tasks</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="completed-content">
          {completedTasks.length === 0 ? (
            <div className="empty-completed">
              <CheckCircle size={48} />
              <p>No completed tasks yet</p>
              <span>Complete some tasks to see them here!</span>
            </div>
          ) : (
            <>
              <div className="completed-stats">
                <div className="stat-item">
                  <span className="stat-number">{completedTasks.length}</span>
                  <span className="stat-label">Total Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {completedTasks.filter(ct => ct.completedAt > Date.now() - 24 * 60 * 60 * 1000).length}
                  </span>
                  <span className="stat-label">Last 24 Hours</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {completedTasks.filter(ct => ct.completedAt > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
                  </span>
                  <span className="stat-label">This Week</span>
                </div>
              </div>
              <div className="completed-tasks-list">
                {sortedTasks.map((completedTask) => {
                  const projectDef = projectDefinitions.find(p => p.id === completedTask.task.projectId);
                  const currentProjectColor = projectDef ? projectDef.color : completedTask.task.projectColor;

                  return (
                    <div 
                      key={completedTask.task.id} 
                      className={`completed-task-item ${getProjectClass(currentProjectColor)}`}
                    >
                      <div className="completed-task-info">
                        <div className="completed-task-title">
                          <CheckCircle size={16} className="completed-icon" />
                          <span className="project-name">[{getProjectTitle(completedTask.task.projectId)}]</span>
                          <span className="task-text">{completedTask.task.title}</span>
                        </div>
                        <div className="completed-task-meta">
                          Completed {formatDate(completedTask.completedAt)} • {getTimeAgo(completedTask.completedAt)}
                        </div>
                      </div>
                      <div className="completed-task-actions">
                        <button 
                          className="incomplete-btn"
                          onClick={() => onMarkIncomplete(completedTask)}
                          title="Mark as incomplete"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Recycle Bin Modal Component
function RecycleBinModal({ deletedTasks, onRestore, onPermanentDelete, onClose }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (deletedAt) => {
    const daysSinceDeleted = Math.floor((Date.now() - deletedAt) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysSinceDeleted);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content recycle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Recycle Bin</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="recycle-content">
          {deletedTasks.length === 0 ? (
            <div className="empty-recycle">
              <Trash size={48} />
              <p>Recycle bin is empty</p>
            </div>
          ) : (
            <div className="deleted-tasks-list">
              {deletedTasks.map((deletedTask) => (
                <div key={deletedTask.task.id} className="deleted-task-item">
                  <div className="deleted-task-info">
                    <div className="deleted-task-title">{deletedTask.task.title}</div>
                    <div className="deleted-task-meta">
                      Deleted {formatDate(deletedTask.deletedAt)} • {getDaysRemaining(deletedTask.deletedAt)} days remaining
                    </div>
                  </div>
                  <div className="deleted-task-actions">
                    <button 
                      className="restore-btn"
                      onClick={() => onRestore(deletedTask)}
                      title="Restore task"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button 
                      className="permanent-delete-btn"
                      onClick={() => onPermanentDelete(deletedTask.task.id)}
                      title="Delete permanently"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit Task Modal Component
function EditTaskModal({ task, onSave, onCancel, projectDefinitions }) {
  const [title, setTitle] = useState(task.title);
  const [selectedProject, setSelectedProject] = useState(task.projectId || '');

  useEffect(() => {
    setTitle(task.title);
    setSelectedProject(task.projectId || '');
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      const project = projectDefinitions.find(p => p.id === selectedProject);
      onSave(task.id, {
        title: title.trim(),
        projectId: selectedProject,
        projectColor: project?.color || task.projectColor 
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button className="modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="taskTitle">Task Title</label>
            <input
              id="taskTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="modal-input"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="taskProject">Project</label>
            <select 
              id="taskProject"
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              className="modal-select"
            >
              {projectDefinitions.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="modal-btn cancel">
              Cancel
            </button>
            <button type="submit" className="modal-btn save">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Project Modal Component
function EditProjectModal({ project, onSave, onCancel }) {
  const [title, setTitle] = useState(project.title);
  const [selectedColor, setSelectedColor] = useState(project.color);

  useEffect(() => {
    setTitle(project.title);
    setSelectedColor(project.color);
  }, [project]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(project.id, title.trim(), selectedColor);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Project</h2>
          <button className="modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="projectTitleEdit">Project Title</label>
            <input
              id="projectTitleEdit"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="modal-input"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Project Color</label>
            <div className="color-picker">
              {PROJECT_COLORS.map(color => (
                <div
                  key={color.value}
                  className={`color-option ${getProjectClass(color.value)} ${selectedColor === color.value ? 'selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                >
                  {selectedColor === color.value && <Check size={16} />}
                </div>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="modal-btn cancel">
              Cancel
            </button>
            <button type="submit" className="modal-btn save">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Project Modal Component
function AddProjectModal({ onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0].value); 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim(), selectedColor);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Project</h2>
          <button className="modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="newProjectTitle">Project Title</label>
            <input
              id="newProjectTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="modal-input"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Project Color</label>
            <div className="color-picker">
              {PROJECT_COLORS.map(color => (
                <div
                  key={color.value}
                  className={`color-option ${getProjectClass(color.value)} ${selectedColor === color.value ? 'selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                >
                  {selectedColor === color.value && <Check size={16} />}
                </div>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="modal-btn cancel">
              Cancel
            </button>
            <button type="submit" className="modal-btn save">
              Add Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// Confirm Delete Project Modal
function ConfirmDeleteProjectModal({ project, hasOutstandingTasks, onConfirmDeleteEmpty, onCancel }) {
  if (!project) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete Project: {project.title}</h2>
          <button className="modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <AlertTriangle size={48} className="warning-icon" />
          {hasOutstandingTasks ? (
            <p>This project cannot be deleted because it has outstanding tasks. Please complete, delete, or reassign all associated tasks before deleting the project.</p>
          ) : (
            <p>Are you sure you want to delete this project? This action cannot be undone.</p>
          )}
        </div>
        <div className="modal-actions">
          {hasOutstandingTasks ? (
            <button type="button" onClick={onCancel} className="modal-btn ok-btn">
              OK
            </button>
          ) : (
            <>
              <button type="button" onClick={onCancel} className="modal-btn cancel">
                Cancel
              </button>
              <button type="button" onClick={() => onConfirmDeleteEmpty(project)} className="modal-btn delete">
                Delete Project
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// Column Component (No longer Droppable or Sortable context provider)
function Column({ id, title, tasks, isMaster = false, onTaskContextMenu, onProjectContextMenu }) { 
  // Removed useDroppable
  return (
    <div className={`day-column`}> {/* Removed drag-over class logic */}
      <div className="day-header">{title}</div>
      <div className="task-list">
        {/* Removed SortableContext */}
        {tasks.map(item => {
          if (item.type === 'project') {
            return <ProjectHeader // Was SortableProjectHeader
                      key={item.id} 
                      project={item} 
                      onContextMenu={isMaster ? onProjectContextMenu : undefined} 
                   />;
          } else {
            return <TaskCard // Was SortableTaskCard
                      key={item.id} 
                      task={item} 
                      onContextMenu={onTaskContextMenu} 
                   />;
          }
        })}
      </div>
    </div>
  );
}

// Storage keys
const STORAGE_KEYS = {
  TASKS: 'yablu-mc-tasks',
  DELETED_TASKS: 'yablu-mc-deleted-tasks',
  COMPLETED_TASKS: 'yablu-mc-completed-tasks',
  PROJECT_DEFINITIONS: 'yablu-mc-project-definitions' 
};

// Helper functions for localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

function App() {
  const [projectDefinitions, setProjectDefinitions] = useState(() => {
    const savedProjectDefs = loadFromStorage(STORAGE_KEYS.PROJECT_DEFINITIONS);
    if (savedProjectDefs) return savedProjectDefs;
    return initialProjectData.map(p => ({ 
        id: p.id, 
        title: p.title, 
        color: typeof p.color === 'string' ? p.color : PROJECT_COLORS[0].value, 
        type: 'project' 
    }));
  });
  
  const [tasks, setTasks] = useState(() => {
    const savedTasks = loadFromStorage(STORAGE_KEYS.TASKS);
    if (savedTasks) return savedTasks;

    const initialState = { master: [] };
    projectDefinitions.forEach(projectDef => { 
      initialState.master.push({ ...projectDef }); 
      const originalProject = initialProjectData.find(p => p.id === projectDef.id);
      if (originalProject && originalProject.children) {
        initialState.master.push(...originalProject.children.map(task => ({ 
            ...task, 
            projectColor: projectDef.color 
        })));
      }
    });
    days.forEach(day => { initialState[day.toLowerCase()] = []; });
    return initialState;
  });

  // Removed activeItem state
  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(null); 
  const [projectToDelete, setProjectToDelete] = useState(null); 
  const [hasOutstandingTasksForDelete, setHasOutstandingTasksForDelete] = useState(false); 
  const [showAddProjectModal, setShowAddProjectModal] = useState(false); 
  const [deletedTasks, setDeletedTasks] = useState(() => loadFromStorage(STORAGE_KEYS.DELETED_TASKS) || []);
  const [completedTasks, setCompletedTasks] = useState(() => loadFromStorage(STORAGE_KEYS.COMPLETED_TASKS) || []);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  
  const [taskContextMenu, setTaskContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [projectContextMenu, setProjectContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });


  useEffect(() => {
    const cleanupOldTasks = () => {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      setDeletedTasks(prev => {
        const filtered = prev.filter(deletedTask => deletedTask.deletedAt > thirtyDaysAgo);
        if (filtered.length !== prev.length) {
          saveToStorage(STORAGE_KEYS.DELETED_TASKS, filtered);
        }
        return filtered;
      });
    };
    cleanupOldTasks();
  }, []);

  useEffect(() => {
    const handleClick = () => {
      if (taskContextMenu.visible) setTaskContextMenu(prev => ({ ...prev, visible: false }));
      if (projectContextMenu.visible) setProjectContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [taskContextMenu.visible, projectContextMenu.visible]); 

  useEffect(() => { saveToStorage(STORAGE_KEYS.TASKS, tasks); }, [tasks]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.DELETED_TASKS, deletedTasks); }, [deletedTasks]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.COMPLETED_TASKS, completedTasks); }, [completedTasks]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PROJECT_DEFINITIONS, projectDefinitions); }, [projectDefinitions]);

  // Removed sensors and customCollisionDetection
  
  const handleTaskContextMenu = (event, task) => {
    event.preventDefault();
    event.stopPropagation();
    setProjectContextMenu(prev => ({ ...prev, visible: false })); 
    setTaskContextMenu({ visible: true, x: event.clientX, y: event.clientY, item: task });
  };

  const handleProjectContextMenu = (event, project) => {
    event.preventDefault();
    event.stopPropagation();
    setTaskContextMenu(prev => ({ ...prev, visible: false })); 
    setProjectContextMenu({ visible: true, x: event.clientX, y: event.clientY, item: project });
  };

  const findTaskLocation = (taskId) => {
    for (const [containerName, containerTasks] of Object.entries(tasks)) {
      const taskIndex = containerTasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) return { container: containerName, index: taskIndex };
    }
    return null;
  };

  const handleEditTask = (task) => { 
    setEditingTask(task); 
    setTaskContextMenu(prev => ({ ...prev, visible: false }));
  };
  const handleSaveTask = (taskId, taskData) => {
    setTasks(prevTasks => {
      const updatedTasks = {};
      for (const [containerName, containerItems] of Object.entries(prevTasks)) {
        updatedTasks[containerName] = containerItems.map(item => 
          item.id === taskId ? { ...item, ...taskData } : item
        );
      }
      return updatedTasks;
    });
    setEditingTask(null);
  };
  const handleCancelEditTask = () => setEditingTask(null);

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleSaveProject = (projectId, newTitle, newColor) => {
    setProjectDefinitions(prevDefs =>
      prevDefs.map(p => (p.id === projectId ? { ...p, title: newTitle, color: newColor } : p))
    );
    
    setTasks(prevTasks => {
      const updatedTasksState = { ...prevTasks };
      Object.keys(updatedTasksState).forEach(columnKey => {
        updatedTasksState[columnKey] = updatedTasksState[columnKey].map(item => {
          if (item.type === 'project' && item.id === projectId) {
            return { ...item, title: newTitle, color: newColor };
          }
          if (item.type === 'task' && item.projectId === projectId) {
            return { ...item, projectColor: newColor };
          }
          return item;
        });
      });
      return updatedTasksState;
    });
    setEditingProject(null);
  };
  const handleCancelEditProject = () => setEditingProject(null);

  // Add New Project Logic
  const handleOpenAddProjectModal = () => {
    setShowAddProjectModal(true);
  };

  const handleAddNewProject = (title, color) => {
    const newProjectId = `project-${Date.now()}`; 
    const newProjectDefinition = {
      id: newProjectId,
      title,
      color,
      type: 'project'
    };
    setProjectDefinitions(prevDefs => [...prevDefs, newProjectDefinition]);
    setTasks(prevTasks => ({
      ...prevTasks,
      master: [...prevTasks.master, newProjectDefinition] 
    }));
    setShowAddProjectModal(false);
  };


  // Delete Project Logic
  const handleDeleteProjectInitiation = (project) => {
    setProjectContextMenu(prev => ({ ...prev, visible: false }));
    let hasTasks = false;
    for (const columnKey of Object.keys(tasks)) {
      if (tasks[columnKey].some(taskItem => taskItem.type === 'task' && taskItem.projectId === project.id)) {
        hasTasks = true;
        break;
      }
    }
    setHasOutstandingTasksForDelete(hasTasks);
    setProjectToDelete(project);
  };

  const executeDeleteEmptyProject = (project) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      master: prevTasks.master.filter(item => item.id !== project.id || item.type !== 'project')
    }));
    setProjectDefinitions(prevDefs => prevDefs.filter(p => p.id !== project.id));
    setProjectToDelete(null);
  };


  const handleDeleteTask = (task) => {
    const location = findTaskLocation(task.id);
    if (!location) return;
    const deletedTaskRecord = { task, deletedAt: Date.now(), originalContainer: location.container, originalIndex: location.index };
    setDeletedTasks(prev => [...prev, deletedTaskRecord]);
    setTasks(prevTasks => {
      const updatedTasks = {};
      for (const [containerName, containerItems] of Object.entries(prevTasks)) {
        updatedTasks[containerName] = containerItems.filter(t => t.id !== task.id);
      }
      return updatedTasks;
    });
    setTaskContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleRestoreTask = (deletedTaskRecord) => {
    const { task, originalContainer, originalIndex } = deletedTaskRecord;
    setDeletedTasks(prev => prev.filter(dt => dt.task.id !== task.id));
    setTasks(prevTasks => {
      const updatedTasks = { ...prevTasks };
      Object.keys(updatedTasks).forEach(key => updatedTasks[key] = [...updatedTasks[key]]); 

      if (updatedTasks[originalContainer]) {
        const targetIndex = Math.min(originalIndex, updatedTasks[originalContainer].length);
        updatedTasks[originalContainer].splice(targetIndex, 0, task);
      } else {
        updatedTasks.master.push(task);
      }
      return updatedTasks;
    });
  };

  const handleCompleteTask = (task) => {
    const location = findTaskLocation(task.id);
    if (!location) return;
    const projectDef = projectDefinitions.find(p => p.id === task.projectId);
    const currentProjectColor = projectDef ? projectDef.color : task.projectColor;

    const completedTaskRecord = { 
      task: { ...task, projectColor: currentProjectColor }, 
      completedAt: Date.now(), 
      originalContainer: location.container, 
      originalIndex: location.index 
    };
    setCompletedTasks(prev => [...prev, completedTaskRecord]);
    setTasks(prevTasks => {
      const updatedTasks = {};
      for (const [containerName, containerItems] of Object.entries(prevTasks)) {
        updatedTasks[containerName] = containerItems.filter(t => t.id !== task.id);
      }
      return updatedTasks;
    });
    setTaskContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleMarkIncomplete = (completedTaskRecord) => {
    const { task, originalContainer, originalIndex } = completedTaskRecord;
    setCompletedTasks(prev => prev.filter(ct => ct.task.id !== task.id));
    setTasks(prevTasks => {
      const updatedTasks = { ...prevTasks };
       Object.keys(updatedTasks).forEach(key => updatedTasks[key] = [...updatedTasks[key]]); 

      if (updatedTasks[originalContainer]) {
        const targetIndex = Math.min(originalIndex, updatedTasks[originalContainer].length);
        updatedTasks[originalContainer].splice(targetIndex, 0, task);
      } else {
        updatedTasks.master.push(task);
      }
      return updatedTasks;
    });
  };

  const handlePermanentDelete = (taskId) => {
    setDeletedTasks(prev => prev.filter(dt => dt.task.id !== taskId));
  };

  // Removed handleDragStart and handleDragEnd

  const taskContextMenuActions = [
    { label: 'Edit', handler: handleEditTask, icon: <Edit2 size={14} />, className: 'edit-btn' },
    { label: 'Delete', handler: handleDeleteTask, icon: <Trash2 size={14} />, className: 'delete-btn' },
    { label: 'Complete', handler: handleCompleteTask, icon: <Check size={14} />, className: 'complete-btn' },
  ];

  const projectContextMenuActions = [
    { label: 'Edit Project', handler: handleEditProject, icon: <Edit2 size={14} />, className: 'edit-btn' },
    { label: 'Delete Project', handler: handleDeleteProjectInitiation, icon: <Trash2 size={14} />, className: 'delete-btn delete-project-btn' },
  ];


  return (
    <div className="app">
      <div className="header">
        <h1>YABLU-MC</h1>
        <p>Weekly Task Planner</p>
        <div className="header-buttons">
          <button 
            className="add-new-project-btn header-action-btn" 
            onClick={handleOpenAddProjectModal}
            title="Add New Project"
          >
            <PlusCircle size={20} />
          </button>
          <button 
            className="completed-tasks-btn header-action-btn" 
            onClick={() => setShowCompletedTasks(true)}
            title="Completed Tasks"
          >
            <CheckCircle size={20} />
          </button>
          <button 
            className="recycle-bin-btn header-action-btn" 
            onClick={() => setShowRecycleBin(true)}
            title="Recycle Bin"
          >
            <Trash size={20} />
          </button>
        </div>
      </div>
      
      {/* DndContext and DragOverlay removed */}
      <div className="planner-container">
        <Column // Was DroppableColumn
          id="master"
          title="Master Tasks"
          tasks={tasks.master} 
          isMaster={true}
          onTaskContextMenu={handleTaskContextMenu}
          onProjectContextMenu={handleProjectContextMenu}
        />

        <div className="week-columns">
          {days.map(day => (
            <Column // Was DroppableColumn
              key={day}
              id={day.toLowerCase()}
              title={day}
              tasks={tasks[day.toLowerCase()]}
              onTaskContextMenu={handleTaskContextMenu}
            />
          ))}
        </div>
      </div>

      <AppContextMenu
        menuData={taskContextMenu}
        actions={taskContextMenuActions}
        onClose={() => setTaskContextMenu(prev => ({ ...prev, visible: false }))}
      />
      <AppContextMenu
        menuData={projectContextMenu}
        actions={projectContextMenuActions}
        onClose={() => setProjectContextMenu(prev => ({ ...prev, visible: false }))}
      />

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleSaveTask}
          onCancel={handleCancelEditTask}
          projectDefinitions={projectDefinitions} 
        />
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onSave={handleSaveProject}
          onCancel={handleCancelEditProject}
        />
      )}
      
      {showAddProjectModal && (
        <AddProjectModal
          onSave={handleAddNewProject}
          onCancel={() => setShowAddProjectModal(false)}
        />
      )}

      {projectToDelete && (
        <ConfirmDeleteProjectModal
          project={projectToDelete}
          hasOutstandingTasks={hasOutstandingTasksForDelete}
          onConfirmDeleteEmpty={executeDeleteEmptyProject} 
          onCancel={() => setProjectToDelete(null)}
        />
      )}

      {showCompletedTasks && (
        <CompletedTasksModal
          completedTasks={completedTasks}
          onMarkIncomplete={handleMarkIncomplete}
          onClose={() => setShowCompletedTasks(false)}
          projectDefinitions={projectDefinitions} 
        />
      )}

      {showRecycleBin && (
        <RecycleBinModal
          deletedTasks={deletedTasks}
          onRestore={handleRestoreTask}
          onPermanentDelete={handlePermanentDelete}
          onClose={() => setShowRecycleBin(false)}
        />
      )}
    </div>
  );
}

export default App;

