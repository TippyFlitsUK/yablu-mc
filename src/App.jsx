import React, { useState, useEffect, useReducer } from 'react';
import { Edit2, Trash2 as TrashIcon, Check as CheckIcon } from 'lucide-react'; // Renamed icons
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

import { appReducer, initialAppState } from './reducers/appReducer';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './utils/storage';
import { DAYS } from './utils/constants';


function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  // UI State (modals, context menus) - kept separate from core data reducer for now
  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [hasOutstandingTasksForDelete, setHasOutstandingTasksForDelete] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [taskContextMenu, setTaskContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [projectContextMenu, setProjectContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });

  // Load initial state from localStorage and initialize reducer
  useEffect(() => {
    const loadedProjectDefs = loadFromStorage(STORAGE_KEYS.PROJECT_DEFINITIONS);
    const loadedTasks = loadFromStorage(STORAGE_KEYS.TASKS);
    const loadedDeletedTasks = loadFromStorage(STORAGE_KEYS.DELETED_TASKS);
    const loadedCompletedTasks = loadFromStorage(STORAGE_KEYS.COMPLETED_TASKS);

    dispatch({
      type: 'INITIALIZE_STATE',
      payload: {
        projectDefinitions: loadedProjectDefs, // Reducer handles null by using defaults
        tasks: loadedTasks, // Reducer handles null
        deletedTasks: loadedDeletedTasks || [],
        completedTasks: loadedCompletedTasks || [],
      }
    });
  }, []);

  // Save state to localStorage whenever core data changes
  useEffect(() => {
    if (state.projectDefinitions && state.projectDefinitions.length > 0) {
        saveToStorage(STORAGE_KEYS.PROJECT_DEFINITIONS, state.projectDefinitions);
    }
    if (state.tasks && state.tasks.master && Object.keys(state.tasks.master).length > 0) { // Check if tasks.master is populated
        saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
    }
    if (state.deletedTasks) { // No minimum length check, empty array is valid
        saveToStorage(STORAGE_KEYS.DELETED_TASKS, state.deletedTasks);
    }
    if (state.completedTasks) {
        saveToStorage(STORAGE_KEYS.COMPLETED_TASKS, state.completedTasks);
    }
  }, [state.projectDefinitions, state.tasks, state.deletedTasks, state.completedTasks]);

  // Auto-cleanup old deleted tasks (e.g., older than 30 days)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      dispatch({ type: 'CLEANUP_OLD_DELETED_TASKS' });
    }, 24 * 60 * 60 * 1000); // Once a day
    dispatch({ type: 'CLEANUP_OLD_DELETED_TASKS' }); // Initial cleanup
    return () => clearInterval(cleanupInterval);
  }, []);

  // Global click listener to close context menus
  useEffect(() => {
    const handleClick = () => {
      if (taskContextMenu.visible) setTaskContextMenu(prev => ({ ...prev, visible: false }));
      if (projectContextMenu.visible) setProjectContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [taskContextMenu.visible, projectContextMenu.visible]);


  // Context Menu Handlers
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

  // Modal Open/Close Handlers
  const handleOpenAddProjectModal = () => setShowAddProjectModal(true);
  const handleCloseAddProjectModal = () => setShowAddProjectModal(false);

  const handleOpenEditTaskModal = (task) => setEditingTask(task);
  const handleCloseEditTaskModal = () => setEditingTask(null);

  const handleOpenEditProjectModal = (project) => setEditingProject(project);
  const handleCloseEditProjectModal = () => setEditingProject(null);

  const handleOpenDeleteProjectModal = (project) => {
    let hasTasks = false;
    if (state.tasks) { // Ensure state.tasks is not null/undefined
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


  // Action Dispatchers (delegating logic to reducer)
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

  // Context Menu Action Definitions
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
          onTaskContextMenu={handleTaskContextMenu}
          onProjectContextMenu={handleProjectContextMenu}
        />
        <div className="week-columns">
          {DAYS.map(day => (
            <Column
              key={day}
              id={day.toLowerCase()}
              title={day}
              items={state.tasks && state.tasks[day.toLowerCase()] ? state.tasks[day.toLowerCase()] : []}
              onTaskContextMenu={handleTaskContextMenu}
              // No project context menu for day columns
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
  );
}

export default App;
