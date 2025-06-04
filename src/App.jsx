import React, { useState, useEffect, useReducer } from 'react';
import { Edit2, Trash2 as TrashIcon, Check as CheckIcon } from 'lucide-react';
import './App.css';

import AppHeader from './components/Header';
import Column from './components/Column';
import AppContextMenu from './components/AppContextMenu';
import EditTaskModal from './components/EditTaskModal';
import EditProjectModal from './components/EditProjectModal';
import AddProjectModal from './components/AddProjectModal';
import ConfirmDeleteProjectModal from './components/ConfirmDeleteProjectModal';
import CompletedTasksModal from './components/CompletedTasksModal';
import RecycleBinModal from './components/RecycleBinModal';
import TaskCard from './components/TaskCard'; 

import { appReducer, initialAppState } from './reducers/appReducer';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './utils/storage';
import { DAYS } from './utils/constants';

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  rectIntersection, 
  DragOverlay, 
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [isStateInitialized, setIsStateInitialized] = useState(false); // New state for initialization tracking

  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [hasOutstandingTasksForDelete, setHasOutstandingTasksForDelete] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [taskContextMenu, setTaskContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [projectContextMenu, setProjectContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [activeDragItem, setActiveDragItem] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load initial state
  useEffect(() => {
    console.log("[App.jsx] Attempting to load initial state from localStorage.");
    const loadedProjectDefs = loadFromStorage(STORAGE_KEYS.PROJECT_DEFINITIONS);
    const loadedTasks = loadFromStorage(STORAGE_KEYS.TASKS);
    const loadedDeletedTasks = loadFromStorage(STORAGE_KEYS.DELETED_TASKS);
    const loadedCompletedTasks = loadFromStorage(STORAGE_KEYS.COMPLETED_TASKS);

    dispatch({
      type: 'INITIALIZE_STATE',
      payload: {
        projectDefinitions: loadedProjectDefs,
        tasks: loadedTasks,
        deletedTasks: loadedDeletedTasks || [],
        completedTasks: loadedCompletedTasks || [],
      }
    });
    setIsStateInitialized(true); // Mark state as initialized AFTER dispatch
    console.log("[App.jsx] State initialization attempt complete. isStateInitialized set to true.");
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save state to localStorage whenever core data changes, BUT ONLY if state has been initialized
  useEffect(() => {
    if (!isStateInitialized) {
      console.log("[App.jsx] Save useEffect: Skipping save, state not yet initialized.");
      return; // Don't save if the initial state load hasn't happened
    }

    console.log("[App.jsx] Save useEffect: Attempting to save state. Current state:", {
      projectDefinitions: state.projectDefinitions,
      tasks: state.tasks,
      // deletedTasks: state.deletedTasks, // Log less to avoid large objects if not needed for this debug
      // completedTasks: state.completedTasks
    });

    if (state.projectDefinitions && Array.isArray(state.projectDefinitions)) {
      // console.log("[App.jsx] Saving projectDefinitions to localStorage:", state.projectDefinitions);
      saveToStorage(STORAGE_KEYS.PROJECT_DEFINITIONS, state.projectDefinitions);
    } else {
      // console.warn("[App.jsx] Not saving projectDefinitions - state.projectDefinitions is not an array or is null/undefined.", state.projectDefinitions);
    }

    if (state.tasks && typeof state.tasks === 'object' && state.tasks !== null) {
      // console.log("[App.jsx] Saving tasks to localStorage:", state.tasks);
      saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
    } else {
      // console.warn("[App.jsx] Not saving tasks - state.tasks is not an object or is null.", state.tasks);
    }
    
    if (state.deletedTasks) {
      // console.log("[App.jsx] Saving deletedTasks to localStorage:", state.deletedTasks);
      saveToStorage(STORAGE_KEYS.DELETED_TASKS, state.deletedTasks);
    } else {
      //  console.warn("[App.jsx] Not saving deletedTasks - state.deletedTasks is null/undefined.", state.deletedTasks);
    }

    if (state.completedTasks) {
      // console.log("[App.jsx] Saving completedTasks to localStorage:", state.completedTasks);
      saveToStorage(STORAGE_KEYS.COMPLETED_TASKS, state.completedTasks);
    } else {
      // console.warn("[App.jsx] Not saving completedTasks - state.completedTasks is null/undefined.", state.completedTasks);
    }
    console.log("[App.jsx] Save useEffect: Save attempt finished.");
  }, [state.projectDefinitions, state.tasks, state.deletedTasks, state.completedTasks, isStateInitialized]); // Added isStateInitialized


  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      dispatch({ type: 'CLEANUP_OLD_DELETED_TASKS' });
    }, 24 * 60 * 60 * 1000);
    dispatch({ type: 'CLEANUP_OLD_DELETED_TASKS' }); // Initial cleanup on load, after state is initialized
    return () => clearInterval(cleanupInterval);
  }, []); // This will run after the first render.

  useEffect(() => {
    const handleClick = () => {
      if (taskContextMenu.visible) setTaskContextMenu(prev => ({ ...prev, visible: false }));
      if (projectContextMenu.visible) setProjectContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [taskContextMenu.visible, projectContextMenu.visible]);


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

  const handleOpenAddProjectModal = () => setShowAddProjectModal(true);
  const handleCloseAddProjectModal = () => setShowAddProjectModal(false);

  const handleOpenEditTaskModal = (task) => setEditingTask(task);
  const handleCloseEditTaskModal = () => setEditingTask(null);

  const handleOpenEditProjectModal = (project) => setEditingProject(project);
  const handleCloseEditProjectModal = () => setEditingProject(null);

  const handleOpenDeleteProjectModal = (project) => {
    let hasTasks = false;
    if (state.tasks) {
        for (const columnKey of Object.keys(state.tasks)) {
            if (state.tasks[columnKey] && state.tasks[columnKey].some(taskItem => taskItem.type === 'task' && taskItem.projectId === project.id)) {
                hasTasks = true;
                break;
            }
        }
    }
    setHasOutstandingTasksForDelete(hasTasks);
    setProjectToDelete(project);
  };
  const handleCloseDeleteProjectModal = () => setProjectToDelete(null);

  const handleSaveNewProject = (title, color) => {
    dispatch({ type: 'ADD_PROJECT', payload: { title, color } });
    handleCloseAddProjectModal();
  };

  const handleSaveEditedProject = (projectId, newTitle, newColor) => {
    dispatch({ type: 'EDIT_PROJECT', payload: { projectId, newTitle, newColor } });
    handleCloseEditProjectModal();
  };

  const confirmDeleteEmptyProject = (project) => {
    dispatch({ type: 'DELETE_PROJECT', payload: project });
    handleCloseDeleteProjectModal();
  };
  
  const handleSaveEditedTask = (taskId, taskData) => {
    dispatch({ type: 'EDIT_TASK', payload: { taskId, taskData } });
    handleCloseEditTaskModal();
  };

  const handleDeleteTaskAction = (task) => dispatch({ type: 'DELETE_TASK', payload: task });
  const handleCompleteTaskAction = (task) => dispatch({ type: 'COMPLETE_TASK', payload: task });
  const handleRestoreTaskAction = (deletedTaskRecord) => dispatch({ type: 'RESTORE_TASK', payload: deletedTaskRecord });
  const handleMarkIncompleteAction = (completedTaskRecord) => dispatch({ type: 'MARK_INCOMPLETE', payload: completedTaskRecord });
  const handlePermanentDeleteTaskAction = (taskId) => dispatch({ type: 'PERMANENT_DELETE_TASK', payload: taskId });

  function handleDragStart(event) {
    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveDragItem(active.data.current.task);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveDragItem(null); 

    if (!over) {
      return; 
    }

    if (active.id.startsWith('project-')) {
        return;
    }
    
    const activeContainer = active.data.current?.originalColumnId; 
    let overContainer;
    if (over.data.current?.originalColumnId) { 
        overContainer = over.data.current.originalColumnId;
    } else { 
        overContainer = over.id;
    }

    if (active.id === over.id && activeContainer === overContainer) {
      // No actual move, but reducer might still reorder if indices differ due to other logic
    }
    
    if (!activeContainer || !overContainer) {
        return;
    }

    dispatch({
      type: 'MOVE_TASK',
      payload: {
        activeId: active.id,
        overId: over.id, 
        activeContainer,
        overContainer,
      },
    });
  }

  function handleDragCancel() {
    setActiveDragItem(null);
  }

  const taskContextMenuActions = [
    { label: 'Edit', handler: handleOpenEditTaskModal, icon: <Edit2 size={14} />, className: 'edit-btn' },
    { label: 'Delete', handler: handleDeleteTaskAction, icon: <TrashIcon size={14} />, className: 'delete-btn' },
    { label: 'Complete', handler: handleCompleteTaskAction, icon: <CheckIcon size={14} />, className: 'complete-btn' },
  ];

  const projectContextMenuActions = [
    { label: 'Edit Project', handler: handleOpenEditProjectModal, icon: <Edit2 size={14} />, className: 'edit-btn' },
    { label: 'Delete Project', handler: handleOpenDeleteProjectModal, icon: <TrashIcon size={14} />, className: 'delete-btn delete-project-btn' },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="app">
        <AppHeader
          onOpenAddProjectModal={handleOpenAddProjectModal}
          onShowCompletedTasks={() => setShowCompletedTasks(true)}
          onShowRecycleBin={() => setShowRecycleBin(true)}
          recycleBinCount={state.deletedTasks?.length || 0}
        />

        <div className="planner-container">
          <Column
            id="master" 
            title="Master Tasks"
            items={state.tasks?.master || []}
            isMaster={true}
            onProjectContextMenu={handleProjectContextMenu}
            onTaskContextMenu={handleTaskContextMenu} 
          />
          <div className="week-columns">
            {DAYS.map(day => (
              <Column
                key={day}
                id={day.toLowerCase()} 
                title={day}
                items={(state.tasks && state.tasks[day.toLowerCase()]) ? state.tasks[day.toLowerCase()] : []}
                onTaskContextMenu={handleTaskContextMenu} 
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragItem ? (
            <TaskCard task={activeDragItem} /> 
          ) : null}
        </DragOverlay>

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
            projectDefinitions={state.projectDefinitions || []}
            onSave={handleSaveEditedTask}
            onCancel={handleCloseEditTaskModal}
          />
        )}
        {editingProject && (
          <EditProjectModal
            project={editingProject}
            onSave={handleSaveEditedProject}
            onCancel={handleCloseEditProjectModal}
          />
        )}
        {showAddProjectModal && (
          <AddProjectModal
            onSave={handleSaveNewProject}
            onCancel={handleCloseAddProjectModal}
          />
        )}
        {projectToDelete && (
          <ConfirmDeleteProjectModal
            project={projectToDelete}
            hasOutstandingTasks={hasOutstandingTasksForDelete}
            onConfirmDeleteEmpty={confirmDeleteEmptyProject}
            onCancel={handleCloseDeleteProjectModal}
          />
        )}
        {showCompletedTasks && (
          <CompletedTasksModal
            completedTasks={state.completedTasks || []}
            projectDefinitions={state.projectDefinitions || []}
            onMarkIncomplete={handleMarkIncompleteAction}
            onClose={() => setShowCompletedTasks(false)}
          />
        )}
        {showRecycleBin && (
          <RecycleBinModal
            deletedTasks={state.deletedTasks || []}
            onRestore={handleRestoreTaskAction}
            onPermanentDelete={handlePermanentDeleteTaskAction}
            onClose={() => setShowRecycleBin(false)}
          />
        )}
      </div>
    </DndContext>
  );
}

export default App;

