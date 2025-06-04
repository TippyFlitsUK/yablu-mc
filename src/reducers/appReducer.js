import { INITIAL_PROJECT_DATA, DAYS, PROJECT_COLORS } from '../utils/constants';
import { arrayMove } from '@dnd-kit/sortable';

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
  const masterTasks = [];
  INITIAL_PROJECT_DATA.forEach(projData => {
    const projectDefinition = projectDefs.find(pd => pd.id === projData.id);
    if (projData.children) {
      masterTasks.push(...projData.children.map(task => ({
        ...task,
        projectId: projData.id,
        projectColor: projectDefinition ? projectDefinition.color : PROJECT_COLORS[0].value,
        type: 'task',
        notes: task.notes || '', // Initialize notes for default tasks
      })));
    }
  });
  return {
    master: masterTasks,
    ...DAYS.reduce((acc, day) => { acc[day.toLowerCase()] = []; return acc; }, {})
  };
}

export function appReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE_STATE': {
      let { projectDefinitions, tasks, deletedTasks, completedTasks } = action.payload;
      if (!projectDefinitions || projectDefinitions.length === 0 || !tasks ) {
        projectDefinitions = getDefaultProjectDefinitions();
        tasks = getDefaultTasks(projectDefinitions);
      } else {
        DAYS.forEach(day => {
          const dayKey = day.toLowerCase();
          if (!tasks[dayKey]) tasks[dayKey] = [];
        });
        if (!tasks.master) tasks.master = [];
        projectDefinitions = (projectDefinitions || []).map(p => ({...p, type: p.type || 'project'}));
        // Ensure all loaded tasks have a notes field
        tasks.master = (tasks.master || []).map(t => ({...t, type: t.type || 'task', notes: t.notes || ''}));
        DAYS.forEach(dayKey => {
            tasks[dayKey.toLowerCase()] = (tasks[dayKey.toLowerCase()] || []).map(t => ({...t, type: t.type || 'task', notes: t.notes || ''}));
        });
      }
      return { ...state, projectDefinitions, tasks, deletedTasks: deletedTasks || [], completedTasks: completedTasks || [] };
    }

    case 'ADD_PROJECT': {
      const { title, color } = action.payload;
      const newProject = { id: `project-${Date.now()}`, title, color, type: 'project' };
      return { ...state, projectDefinitions: [...state.projectDefinitions, newProject] };
    }

    case 'ADD_TASK': {
      const { title, projectId, projectColor, notes } = action.payload; // Added notes
      const newTask = { 
        id: `task-${Date.now()}`, 
        title, 
        projectId, 
        projectColor, 
        type: 'task',
        notes: notes || '' // Ensure notes is initialized
      };
      let updatedMasterTasks = [...(state.tasks.master || []), newTask];
      
      const tempSortedMasterTasks = [];
      (state.projectDefinitions || []).forEach(pDef => {
          updatedMasterTasks.filter(t => t.projectId === pDef.id).forEach(t => tempSortedMasterTasks.push(t));
      });
      updatedMasterTasks = tempSortedMasterTasks;

      return { ...state, tasks: { ...state.tasks, master: updatedMasterTasks } };
    }

    case 'EDIT_PROJECT': {
        const { projectId, newTitle, newColor } = action.payload;
        const updatedProjectDefinitions = state.projectDefinitions.map(p =>
            p.id === projectId ? { ...p, title: newTitle, color: newColor } : p
        );
        const updatedTasks = JSON.parse(JSON.stringify(state.tasks));
        Object.keys(updatedTasks).forEach(listKey => {
            updatedTasks[listKey] = updatedTasks[listKey].map(item => 
                (item.type === 'task' && item.projectId === projectId) ? { ...item, projectColor: newColor } : item
            );
        });
        return { ...state, projectDefinitions: updatedProjectDefinitions, tasks: updatedTasks };
    }

    case 'DELETE_PROJECT': {
        const projectToDelete = action.payload;
        const updatedProjectDefinitions = state.projectDefinitions.filter(p => p.id !== projectToDelete.id);
        const updatedTasks = JSON.parse(JSON.stringify(state.tasks));
        Object.keys(updatedTasks).forEach(listKey => {
            updatedTasks[listKey] = updatedTasks[listKey].filter(task => task.projectId !== projectToDelete.id);
        });
        return { ...state, projectDefinitions: updatedProjectDefinitions, tasks: updatedTasks };
    }
    
    case 'EDIT_TASK': { // This action will now handle notes as well
      const { taskId, taskData } = action.payload; // taskData can include { title, projectId, projectColor, notes }
      const updatedTasks = JSON.parse(JSON.stringify(state.tasks));
      let taskFoundAndUpdated = false;
      Object.keys(updatedTasks).forEach(listKey => {
        updatedTasks[listKey] = updatedTasks[listKey].map(item => {
          if (item.id === taskId && item.type === 'task') {
            taskFoundAndUpdated = true;
            return { ...item, ...taskData, notes: taskData.notes !== undefined ? taskData.notes : item.notes || '' }; // Ensure notes is preserved or updated
          }
          return item;
        });
      });
       if (!taskFoundAndUpdated) console.warn(`EDIT_TASK: Task with ID ${taskId} not found.`);
      return { ...state, tasks: updatedTasks };
    }

    case 'DELETE_TASK': {
      const taskToDelete = action.payload;
      let originalContainer = null, originalIndex = -1;
      for (const listKey of Object.keys(state.tasks)) {
          const index = (state.tasks[listKey] || []).findIndex(t => t.id === taskToDelete.id);
          if (index !== -1) { originalContainer = listKey; originalIndex = index; break; }
      }
      if (!originalContainer) return state;
      const deletedTaskRecord = { task: taskToDelete, deletedAt: Date.now(), originalContainer, originalIndex };
      const newTasksState = JSON.parse(JSON.stringify(state.tasks));
      Object.keys(newTasksState).forEach(listKey => {
          newTasksState[listKey] = (newTasksState[listKey] || []).filter(item => item.id !== taskToDelete.id);
      });
      return { ...state, tasks: newTasksState, deletedTasks: [...state.deletedTasks, deletedTaskRecord] };
    }

    case 'COMPLETE_TASK': {
      const taskToComplete = action.payload;
      let originalContainer = null, originalIndex = -1;
      for (const listKey of Object.keys(state.tasks)) {
          const index = (state.tasks[listKey] || []).findIndex(t => t.id === taskToComplete.id);
          if (index !== -1) { originalContainer = listKey; originalIndex = index; break; }
      }
      if (!originalContainer) return state;
      const projectDef = state.projectDefinitions.find(p => p.id === taskToComplete.projectId);
      const completedTaskRecord = { task: { ...taskToComplete, projectColor: projectDef?.color || taskToComplete.projectColor }, completedAt: Date.now(), originalContainer, originalIndex };
      const newTasksState = JSON.parse(JSON.stringify(state.tasks));
      Object.keys(newTasksState).forEach(listKey => {
          newTasksState[listKey] = (newTasksState[listKey] || []).filter(item => item.id !== taskToComplete.id);
      });
      return { ...state, tasks: newTasksState, completedTasks: [...state.completedTasks, completedTaskRecord] };
    }
    
    case 'RESTORE_TASK':
    case 'MARK_INCOMPLETE': {
        const { task, originalContainer, originalIndex } = action.payload;
        const newTasksState = JSON.parse(JSON.stringify(state.tasks));
        
        if (originalContainer === 'master') {
            let masterTasks = [...(newTasksState.master || []), task];
            const tempSortedMasterTasks = [];
            (state.projectDefinitions || []).forEach(pDef => {
                masterTasks.filter(t => t.projectId === pDef.id).forEach(t => tempSortedMasterTasks.push(t));
            });
            newTasksState.master = tempSortedMasterTasks;
        } else if (newTasksState[originalContainer]) {
            const targetList = newTasksState[originalContainer];
            const insertAtIndex = Math.min(originalIndex, targetList.length);
            targetList.splice(insertAtIndex, 0, task);
        } else { 
            let masterTasks = [...(newTasksState.master || []), task];
            const tempSortedMasterTasks = [];
            (state.projectDefinitions || []).forEach(pDef => {
                masterTasks.filter(t => t.projectId === pDef.id).forEach(t => tempSortedMasterTasks.push(t));
            });
            newTasksState.master = tempSortedMasterTasks;
        }

        if (action.type === 'RESTORE_TASK') {
            return { ...state, tasks: newTasksState, deletedTasks: state.deletedTasks.filter(dt => dt.task.id !== task.id) };
        }
        return { ...state, tasks: newTasksState, completedTasks: state.completedTasks.filter(ct => ct.task.id !== task.id) };
    }

    case 'PERMANENT_DELETE_TASK': {
      return { ...state, deletedTasks: state.deletedTasks.filter(dt => dt.task.id !== action.payload) };
    }
    case 'CLEANUP_OLD_DELETED_TASKS': {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return { ...state, deletedTasks: state.deletedTasks.filter(dt => dt.deletedAt > thirtyDaysAgo) };
    }

    case 'MOVE_PROJECT': {
        const { activeId, overId } = action.payload;
        const projectDefinitions = [...state.projectDefinitions];
        const oldIndex = projectDefinitions.findIndex(p => p.id === activeId);
        let newIndex = projectDefinitions.findIndex(p => p.id === overId);

        if (oldIndex === -1) return state;
        if (activeId === overId) newIndex = oldIndex; 
        else if (overId === 'master' || newIndex === -1) { 
            newIndex = projectDefinitions.length; 
        }
        const updatedProjectDefinitions = arrayMove(projectDefinitions, oldIndex, newIndex);
        return { ...state, projectDefinitions: updatedProjectDefinitions };
    }

    case 'MOVE_TASK': { // Logic from "Targeted Fixes for Regressions v4"
      const { activeId, overId, activeContainer, overContainer, taskProjectId } = action.payload;
      let newTasksState = JSON.parse(JSON.stringify(state.tasks));
      let movedItem;

      if (newTasksState[activeContainer]) {
        const sourceItems = newTasksState[activeContainer];
        const activeIdx = sourceItems.findIndex(item => item.id === activeId);
        if (activeIdx === -1) return state;
        [movedItem] = sourceItems.splice(activeIdx, 1);
      } else { return state; } 
      if (!movedItem) return state; 

      movedItem.projectId = taskProjectId; 

      if (overContainer !== 'master') {
        const targetDayKey = overContainer;
        const originalItemsOfTargetDay = [...(state.tasks[targetDayKey] || [])]; 
        let oldIndexInDayColumn = (activeContainer === targetDayKey) ? originalItemsOfTargetDay.findIndex(item => item.id === activeId) : -1;
        let newIndexInDayColumn;
        if (overId === targetDayKey) { newIndexInDayColumn = originalItemsOfTargetDay.length; } 
        else {
            newIndexInDayColumn = originalItemsOfTargetDay.findIndex(item => item.id === overId);
            if (newIndexInDayColumn === -1) newIndexInDayColumn = originalItemsOfTargetDay.length;
        }
        if (activeContainer === targetDayKey) { 
            if (oldIndexInDayColumn === -1) return state; 
            newTasksState[targetDayKey] = arrayMove(originalItemsOfTargetDay, oldIndexInDayColumn, newIndexInDayColumn);
        } else { 
            const targetListInNewState = newTasksState[targetDayKey] = (newTasksState[targetDayKey] || []);
            if (newIndexInDayColumn >= targetListInNewState.length && overId !== targetDayKey && originalItemsOfTargetDay.findIndex(item => item.id === overId) === -1) {
                 targetListInNewState.push(movedItem);
            } else if (newIndexInDayColumn === originalItemsOfTargetDay.length && overId === targetDayKey) {
                 targetListInNewState.push(movedItem);
            } else {
                 targetListInNewState.splice(Math.max(0, newIndexInDayColumn), 0, movedItem);
            }
        }
      } 
      else if (overContainer === 'master' && activeContainer !== 'master') { 
        let masterTasksPool = newTasksState.master ? [...newTasksState.master] : [];
        movedItem.projectId = taskProjectId; 
        masterTasksPool.push(movedItem); 
        const finalSortedMasterTasks = [];
        (state.projectDefinitions || []).forEach(pDef => {
            masterTasksPool.filter(t => t.projectId === pDef.id).forEach(t => finalSortedMasterTasks.push(t));
        });
        newTasksState.master = finalSortedMasterTasks;
      }
      else if (activeContainer === 'master' && overContainer === 'master') {
        let masterTasksPool = newTasksState.master ? [...newTasksState.master] : [];
        const originalMasterTasks = [...state.tasks.master]; 
        const tasksOfSameProject = originalMasterTasks.filter(t => t.projectId === taskProjectId);
        const oldIdxInProject = tasksOfSameProject.findIndex(t => t.id === activeId);
        if (oldIdxInProject === -1) { masterTasksPool.push(movedItem); } 
        else {
            let newIdxInProject;
            const overItemInOriginalMaster = originalMasterTasks.find(item => item.id === overId);
            if (overId === 'master' || !overItemInOriginalMaster || (overItemInOriginalMaster.type === 'project' && overItemInOriginalMaster.id !== taskProjectId) || (overItemInOriginalMaster.type === 'task' && overItemInOriginalMaster.projectId !== taskProjectId) ) {
                newIdxInProject = tasksOfSameProject.length; 
            } else if (overItemInOriginalMaster.type === 'project' && overItemInOriginalMaster.id === taskProjectId) {
                newIdxInProject = 0; 
            } else { 
                newIdxInProject = tasksOfSameProject.findIndex(t => t.id === overId);
                if (newIdxInProject === -1) newIdxInProject = tasksOfSameProject.length;
            }
            const reorderedProjectTasks = arrayMove(tasksOfSameProject, oldIdxInProject, newIdxInProject);
            const otherProjectTasks = originalMasterTasks.filter(t => t.projectId !== taskProjectId);
            masterTasksPool = [...otherProjectTasks, ...reorderedProjectTasks];
        }
        const finalSortedMasterTasks = [];
        (state.projectDefinitions || []).forEach(pDef => {
            masterTasksPool.filter(t => t.projectId === pDef.id).forEach(t => finalSortedMasterTasks.push(t));
        });
        newTasksState.master = finalSortedMasterTasks;
      }
      return { ...state, tasks: newTasksState };
    }
    default:
      return state;
  }
}

