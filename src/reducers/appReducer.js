import { INITIAL_PROJECT_DATA, DAYS, PROJECT_COLORS } from '../utils/constants';
import { findTaskLocationInTasks } from '../utils/helpers';

export const initialAppState = {
  projectDefinitions: [],
  tasks: {
    master: [],
    ...DAYS.reduce((acc, day) => {
      acc[day.toLowerCase()] = [];
      return acc;
    }, {})
  },
  deletedTasks: [],
  completedTasks: [],
};

function getDefaultProjectDefinitions() {
  return INITIAL_PROJECT_DATA.map(p => ({
    id: p.id,
    title: p.title,
    color: typeof p.color === 'string' ? p.color : PROJECT_COLORS[0].value,
    type: 'project'
  }));
}

function getDefaultTasks(projectDefs) {
  const tasks = {
    master: [],
    ...DAYS.reduce((acc, day) => {
      acc[day.toLowerCase()] = [];
      return acc;
    }, {})
  };
  projectDefs.forEach(projectDef => {
    tasks.master.push({ ...projectDef });
    const originalProject = INITIAL_PROJECT_DATA.find(p => p.id === projectDef.id);
    if (originalProject && originalProject.children) {
      tasks.master.push(...originalProject.children.map(task => ({
        ...task,
        projectColor: projectDef.color
      })));
    }
  });
  return tasks;
}


export function appReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE_STATE': {
      const projectDefinitions = action.payload.projectDefinitions || getDefaultProjectDefinitions();
      const tasks = action.payload.tasks || getDefaultTasks(projectDefinitions);
      return {
        ...state,
        projectDefinitions,
        tasks,
        deletedTasks: action.payload.deletedTasks || [],
        completedTasks: action.payload.completedTasks || [],
      };
    }

    case 'ADD_PROJECT': {
      const { title, color } = action.payload;
      const newProjectId = `project-${Date.now()}`;
      const newProjectDefinition = { id: newProjectId, title, color, type: 'project' };
      return {
        ...state,
        projectDefinitions: [...state.projectDefinitions, newProjectDefinition],
        tasks: {
          ...state.tasks,
          master: [...state.tasks.master, newProjectDefinition]
        }
      };
    }

    case 'EDIT_PROJECT': {
      const { projectId, newTitle, newColor } = action.payload;
      const updatedProjectDefinitions = state.projectDefinitions.map(p =>
        p.id === projectId ? { ...p, title: newTitle, color: newColor } : p
      );
      const updatedTasksState = { ...state.tasks };
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
      return { ...state, projectDefinitions: updatedProjectDefinitions, tasks: updatedTasksState };
    }

    case 'DELETE_PROJECT': { // Only for empty projects
      const project = action.payload;
      return {
        ...state,
        projectDefinitions: state.projectDefinitions.filter(p => p.id !== project.id),
        tasks: {
          ...state.tasks,
          master: state.tasks.master.filter(item => item.id !== project.id || item.type !== 'project')
        }
      };
    }
    
    case 'EDIT_TASK': {
      const { taskId, taskData } = action.payload;
      const updatedTasks = { ...state.tasks };
      for (const columnKey of Object.keys(updatedTasks)) {
        updatedTasks[columnKey] = updatedTasks[columnKey].map(item =>
          item.id === taskId ? { ...item, ...taskData } : item
        );
      }
      return { ...state, tasks: updatedTasks };
    }

    case 'DELETE_TASK': {
      const task = action.payload;
      const location = findTaskLocationInTasks(task.id, state.tasks);
      if (!location) return state;

      const deletedTaskRecord = { task, deletedAt: Date.now(), originalContainer: location.container, originalIndex: location.index };
      const newTasksState = { ...state.tasks };
      for (const [containerName, containerItems] of Object.entries(newTasksState)) {
        newTasksState[containerName] = containerItems.filter(t => t.id !== task.id);
      }
      return {
        ...state,
        tasks: newTasksState,
        deletedTasks: [...state.deletedTasks, deletedTaskRecord]
      };
    }

    case 'COMPLETE_TASK': {
      const task = action.payload;
      const location = findTaskLocationInTasks(task.id, state.tasks);
      if (!location) return state;

      const projectDef = state.projectDefinitions.find(p => p.id === task.projectId);
      const currentProjectColor = projectDef ? projectDef.color : task.projectColor;
      const completedTaskRecord = {
        task: { ...task, projectColor: currentProjectColor },
        completedAt: Date.now(),
        originalContainer: location.container,
        originalIndex: location.index
      };
      const newTasksState = { ...state.tasks };
      for (const [containerName, containerItems] of Object.entries(newTasksState)) {
        newTasksState[containerName] = containerItems.filter(t => t.id !== task.id);
      }
      return {
        ...state,
        tasks: newTasksState,
        completedTasks: [...state.completedTasks, completedTaskRecord]
      };
    }

    case 'RESTORE_TASK': {
      const { task, originalContainer, originalIndex } = action.payload; // payload is deletedTaskRecord
      const newTasks = { ...state.tasks };
      Object.keys(newTasks).forEach(key => newTasks[key] = [...newTasks[key]]);

      if (newTasks[originalContainer]) {
        const targetIndex = Math.min(originalIndex, newTasks[originalContainer].length);
        newTasks[originalContainer].splice(targetIndex, 0, task);
      } else {
        newTasks.master.push(task); // Fallback to master if original container doesn't exist
      }
      return {
        ...state,
        tasks: newTasks,
        deletedTasks: state.deletedTasks.filter(dt => dt.task.id !== task.id)
      };
    }
    
    case 'MARK_INCOMPLETE': {
        const { task, originalContainer, originalIndex } = action.payload; // payload is completedTaskRecord
        const newTasks = { ...state.tasks };
        Object.keys(newTasks).forEach(key => newTasks[key] = [...newTasks[key]]);

        if (newTasks[originalContainer]) {
            const targetIndex = Math.min(originalIndex, newTasks[originalContainer].length);
            newTasks[originalContainer].splice(targetIndex, 0, task);
        } else {
            newTasks.master.push(task);
        }
        return {
            ...state,
            tasks: newTasks,
            completedTasks: state.completedTasks.filter(ct => ct.task.id !== task.id)
        };
    }

    case 'PERMANENT_DELETE_TASK': { // From recycle bin
      const taskId = action.payload;
      return {
        ...state,
        deletedTasks: state.deletedTasks.filter(dt => dt.task.id !== taskId)
      };
    }
    
    case 'CLEANUP_OLD_DELETED_TASKS': {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        return {
            ...state,
            deletedTasks: state.deletedTasks.filter(deletedTask => deletedTask.deletedAt > thirtyDaysAgo)
        };
    }

    default:
      return state;
  }
}
