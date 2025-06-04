import { INITIAL_PROJECT_DATA, DAYS, PROJECT_COLORS } from '../utils/constants';
import { findTaskLocationInTasks } from '../utils/helpers';
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
  console.log("getDefaultProjectDefinitions: Generating default project definitions from INITIAL_PROJECT_DATA.");
  return INITIAL_PROJECT_DATA.map(p => ({
    id: p.id,
    title: p.title,
    color: typeof p.color === 'string' ? p.color : PROJECT_COLORS[0].value,
    type: 'project'
  }));
}

function getDefaultTasks(projectDefs) {
  console.log("getDefaultTasks: Generating default tasks based on provided project definitions.");
  const tasks = {
    master: [],
    ...DAYS.reduce((acc, day) => {
      acc[day.toLowerCase()] = [];
      return acc;
    }, {})
  };
  
  if (projectDefs && projectDefs.length > 0) {
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
  }
  console.log("getDefaultTasks: Resulting tasks structure:", JSON.parse(JSON.stringify(tasks.master.slice(0, 5)))); // Log a sample
  return tasks;
}


export function appReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE_STATE': {
      const loadedProjectDefs = action.payload.projectDefinitions; 
      const loadedTasks = action.payload.tasks;                   

      let finalProjectDefinitions;
      let finalTasks;

      // Simplified condition: If EITHER projects OR tasks are null (i.e., not found in localStorage),
      // then it's considered a fresh start, and we load all default sample data.
      if (loadedProjectDefs === null || loadedTasks === null) {
        console.log("INITIALIZE_STATE: Projects or Tasks (or both) are null from storage. Initializing with default sample data.");
        finalProjectDefinitions = getDefaultProjectDefinitions(); 
        finalTasks = getDefaultTasks(finalProjectDefinitions); 
      } else {
        // Both projects AND tasks were found in storage (even if they are empty arrays/objects representing a user's cleared state).
        // Use the loaded data.
        console.log("INITIALIZE_STATE: Both Projects and Tasks found in storage. Using loaded data.");
        finalProjectDefinitions = loadedProjectDefs;
        finalTasks = { ...loadedTasks }; // Clone

        // Integrity check for loaded tasks: ensure all day columns and master list exist
        DAYS.forEach(day => {
          const dayKey = day.toLowerCase();
          if (finalTasks[dayKey] === undefined) { // Check for undefined, as [] is a valid empty list
            console.warn(`INITIALIZE_STATE: Loaded tasks missing column for ${dayKey}. Initializing as empty array.`);
            finalTasks[dayKey] = [];
          }
        });
        if (finalTasks.master === undefined) { // Check for undefined
          console.warn("INITIALIZE_STATE: Loaded tasks missing 'master' list. Initializing as empty array.");
          finalTasks.master = []; 
        }
      }
      
      console.log("INITIALIZE_STATE: Final projectDefinitions count:", finalProjectDefinitions.length);
      console.log("INITIALIZE_STATE: Final master tasks count:", finalTasks.master ? finalTasks.master.length : 'undefined');


      return {
        ...state,
        projectDefinitions: finalProjectDefinitions,
        tasks: finalTasks,
        deletedTasks: action.payload.deletedTasks || [],
        completedTasks: action.payload.completedTasks || [],
      };
    }

    case 'ADD_PROJECT': {
      const { title, color } = action.payload;
      const newProjectId = `project-${Date.now()}`;
      const newProjectDefinition = { id: newProjectId, title, color, type: 'project' };
      const newMasterTasks = state.tasks.master ? [...state.tasks.master, newProjectDefinition] : [newProjectDefinition];
      return {
        ...state,
        projectDefinitions: [...state.projectDefinitions, newProjectDefinition],
        tasks: {
          ...state.tasks,
          master: newMasterTasks
        }
      };
    }

    case 'EDIT_PROJECT': {
      const { projectId, newTitle, newColor } = action.payload;
      const updatedProjectDefinitions = state.projectDefinitions.map(p =>
        p.id === projectId ? { ...p, title: newTitle, color: newColor } : p
      );
      const updatedTasksState = JSON.parse(JSON.stringify(state.tasks)); 
      Object.keys(updatedTasksState).forEach(columnKey => {
        if(updatedTasksState[columnKey]){ 
            updatedTasksState[columnKey] = updatedTasksState[columnKey].map(item => {
            if (item.type === 'project' && item.id === projectId) {
                return { ...item, title: newTitle, color: newColor };
            }
            if (item.type === 'task' && item.projectId === projectId) {
                return { ...item, projectColor: newColor };
            }
            return item;
            });
        }
      });
      return { ...state, projectDefinitions: updatedProjectDefinitions, tasks: updatedTasksState };
    }

    case 'DELETE_PROJECT': { 
      const project = action.payload;
      const updatedProjectDefinitions = state.projectDefinitions.filter(p => p.id !== project.id);
      const updatedMasterTasks = state.tasks.master ? state.tasks.master.filter(item => item.id !== project.id || item.type !== 'project') : [];
      
      return {
        ...state,
        projectDefinitions: updatedProjectDefinitions,
        tasks: {
          ...state.tasks,
          master: updatedMasterTasks
        }
      };
    }
    
    case 'EDIT_TASK': {
      const { taskId, taskData } = action.payload;
      const updatedTasks = JSON.parse(JSON.stringify(state.tasks)); 
      for (const columnKey of Object.keys(updatedTasks)) {
        if(updatedTasks[columnKey]){
            updatedTasks[columnKey] = updatedTasks[columnKey].map(item =>
            item.id === taskId ? { ...item, ...taskData } : item
            );
        }
      }
      return { ...state, tasks: updatedTasks };
    }

    case 'DELETE_TASK': {
      const task = action.payload;
      const location = findTaskLocationInTasks(task.id, state.tasks);
      if (!location) return state;

      const deletedTaskRecord = { task, deletedAt: Date.now(), originalContainer: location.container, originalIndex: location.index };
      const newTasksState = JSON.parse(JSON.stringify(state.tasks)); 
      for (const [containerName, containerItems] of Object.entries(newTasksState)) {
        if(newTasksState[containerName]){
            newTasksState[containerName] = containerItems.filter(t => t.id !== task.id);
        }
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
      const newTasksState = JSON.parse(JSON.stringify(state.tasks)); 
      for (const [containerName, containerItems] of Object.entries(newTasksState)) {
        if(newTasksState[containerName]){
            newTasksState[containerName] = containerItems.filter(t => t.id !== task.id);
        }
      }
      return {
        ...state,
        tasks: newTasksState,
        completedTasks: [...state.completedTasks, completedTaskRecord]
      };
    }

    case 'RESTORE_TASK': {
      const { task, originalContainer, originalIndex } = action.payload; 
      const newTasks = JSON.parse(JSON.stringify(state.tasks)); 

      if (newTasks[originalContainer]) {
        const targetIndex = Math.min(originalIndex, newTasks[originalContainer].length);
        newTasks[originalContainer].splice(targetIndex, 0, task);
      } else {
        newTasks.master = newTasks.master || []; 
        newTasks.master.push(task); 
      }
      return {
        ...state,
        tasks: newTasks,
        deletedTasks: state.deletedTasks.filter(dt => dt.task.id !== task.id)
      };
    }
    
    case 'MARK_INCOMPLETE': {
        const { task, originalContainer, originalIndex } = action.payload; 
        const newTasks = JSON.parse(JSON.stringify(state.tasks)); 

        if (newTasks[originalContainer]) {
            const targetIndex = Math.min(originalIndex, newTasks[originalContainer].length);
            newTasks[originalContainer].splice(targetIndex, 0, task);
        } else {
            newTasks.master = newTasks.master || []; 
            newTasks.master.push(task);
        }
        return {
            ...state,
            tasks: newTasks,
            completedTasks: state.completedTasks.filter(ct => ct.task.id !== task.id)
        };
    }

    case 'PERMANENT_DELETE_TASK': { 
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

    case 'MOVE_TASK': {
      const { activeId, overId, activeContainer, overContainer } = action.payload;
      const newTasksState = JSON.parse(JSON.stringify(state.tasks));

      if (!newTasksState[activeContainer] || !newTasksState[overContainer]) {
        return state;
      }
      
      const activeItems = newTasksState[activeContainer];
      const overItems = newTasksState[overContainer];
      const activeIndex = activeItems.findIndex(item => item.id === activeId);

      if (activeIndex === -1) {
        return state; 
      }

      if (activeContainer === overContainer) {
        let overIndex = overItems.findIndex(item => item.id === overId);
        
        if (overId === overContainer || (overIndex === -1 && overId !== overContainer && !overItems.find(item => item.id === overId))) {
          overIndex = overItems.length;
        } else if (overIndex === -1 && overId === activeId) {
           overIndex = activeIndex; 
        }
        
        if (activeIndex !== overIndex) {
            newTasksState[activeContainer] = arrayMove(activeItems, activeIndex, overIndex);
        } else {
            return state; 
        }
      } else {
        const [movedItem] = activeItems.splice(activeIndex, 1); 
        let overTaskIndex = overItems.findIndex(item => item.id === overId);
        
        if (overId === overContainer || overTaskIndex === -1) { 
          overItems.push(movedItem); 
        } else {
          overItems.splice(overTaskIndex, 0, movedItem);
        }
      }
      return { ...state, tasks: newTasksState };
    }

    default:
      return state;
  }
}

