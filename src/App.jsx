import React, { useState, useEffect, useReducer } from 'react';
import { Edit2, Trash2 as TrashIcon, Check as CheckIcon, ListPlus, FileText } from 'lucide-react';
import './App.css';

import AppHeader from './components/Header';
import Column from './components/Column'; 
import AppContextMenu from './components/AppContextMenu';
import EditTaskModal from './components/EditTaskModal';
import AddTaskModal from './components/AddTaskModal';
import TaskDetailsModal from './components/TaskDetailsModal'; 
import EditProjectModal from './components/EditProjectModal';
import AddProjectModal from './components/AddProjectModal';
import ConfirmDeleteProjectModal from './components/ConfirmDeleteProjectModal';
import CompletedTasksModal from './components/CompletedTasksModal';
import RecycleBinModal from './components/RecycleBinModal';
import TaskCard from './components/TaskCard';
import ProjectHeader from './components/ProjectHeader'; 

import { appReducer, initialAppState } from './reducers/appReducer';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './utils/storage';
import { DAYS } from './utils/constants';

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [isStateInitialized, setIsStateInitialized] = useState(false);

  const [editingTask, setEditingTask] = useState(null); 
  const [detailedTask, setDetailedTask] = useState(null); 
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [hasOutstandingTasksForDelete, setHasOutstandingTasksForDelete] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [initialProjectIdForModal, setInitialProjectIdForModal] = useState(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [taskContextMenu, setTaskContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [projectContextMenu, setProjectContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [activeDragItem, setActiveDragItem] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, 
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    // console.log("[App.jsx] Initializing state...");
    const loadedProjectDefs = loadFromStorage(STORAGE_KEYS.PROJECT_DEFINITIONS);
    const loadedTasks = loadFromStorage(STORAGE_KEYS.TASKS);
    const loadedDeletedTasks = loadFromStorage(STORAGE_KEYS.DELETED_TASKS);
    const loadedCompletedTasks = loadFromStorage(STORAGE_KEYS.COMPLETED_TASKS);
    dispatch({
      type: 'INITIALIZE_STATE',
      payload: { projectDefinitions: loadedProjectDefs, tasks: loadedTasks, deletedTasks: loadedDeletedTasks, completedTasks: loadedCompletedTasks }
    });
    setIsStateInitialized(true);
    // console.log("[App.jsx] State initialized.");
  }, []);

  useEffect(() => {
    if (!isStateInitialized) return;
    // console.log("[App.jsx] Saving state to localStorage...");
    if (state.projectDefinitions) saveToStorage(STORAGE_KEYS.PROJECT_DEFINITIONS, state.projectDefinitions);
    if (state.tasks) saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
    if (state.deletedTasks) saveToStorage(STORAGE_KEYS.DELETED_TASKS, state.deletedTasks);
    if (state.completedTasks) saveToStorage(STORAGE_KEYS.COMPLETED_TASKS, state.completedTasks);
  }, [state.projectDefinitions, state.tasks, state.deletedTasks, state.completedTasks, isStateInitialized]);

  useEffect(() => {
    const cleanupInterval = setInterval(() => dispatch({ type: 'CLEANUP_OLD_DELETED_TASKS' }), 24 * 60 * 60 * 1000);
    if (isStateInitialized) dispatch({ type: 'CLEANUP_OLD_DELETED_TASKS' });
    return () => clearInterval(cleanupInterval);
  }, [isStateInitialized]);

  useEffect(() => {
    const handleClickOutsideContextMenus = () => {
      // console.log("[App.jsx] Global click detected for closing context menus.");
      if (taskContextMenu.visible) setTaskContextMenu(p => ({ ...p, visible: false }));
      if (projectContextMenu.visible) setProjectContextMenu(p => ({ ...p, visible: false }));
    };
    window.addEventListener('click', handleClickOutsideContextMenus);
    return () => window.removeEventListener('click', handleClickOutsideContextMenus);
  }, [taskContextMenu.visible, projectContextMenu.visible]);

  const handleTaskContextMenu = (event, task) => { 
    console.log(`[App.jsx] handleTaskContextMenu for task: ${task.id}`);
    event.preventDefault(); event.stopPropagation(); 
    setProjectContextMenu(p => ({ ...p, visible: false })); 
    setTaskContextMenu({ visible: true, x: event.clientX, y: event.clientY, item: task }); 
  };
  const handleProjectContextMenu = (event, project) => { 
    console.log(`[App.jsx] handleProjectContextMenu for project: ${project.id}`);
    event.preventDefault(); event.stopPropagation(); 
    setTaskContextMenu(p => ({ ...p, visible: false })); 
    setProjectContextMenu({ visible: true, x: event.clientX, y: event.clientY, item: project }); 
  };
  
  const handleOpenAddProjectModal = () => { console.log("[App.jsx] handleOpenAddProjectModal"); setShowAddProjectModal(true); };
  const handleCloseAddProjectModal = () => { console.log("[App.jsx] handleCloseAddProjectModal"); setShowAddProjectModal(false); };
  const handleOpenAddTaskModal = (projectId = null) => { console.log(`[App.jsx] handleOpenAddTaskModal, projectId: ${projectId}`); setInitialProjectIdForModal(projectId); setShowAddTaskModal(true); };
  const handleCloseAddTaskModal = () => { console.log("[App.jsx] handleCloseAddTaskModal"); setShowAddTaskModal(false); setInitialProjectIdForModal(null);};
  
  const handleOpenEditTaskModal = (task) => { console.log(`[App.jsx] handleOpenEditTaskModal for task: ${task.id}`); setEditingTask(task); };
  const handleCloseEditTaskModal = () => { console.log("[App.jsx] handleCloseEditTaskModal"); setEditingTask(null); };

  const handleOpenTaskDetailsModal = (task) => { 
    console.log(`[App.jsx] handleOpenTaskDetailsModal called for task: ${task.id}, title: ${task.title}`);
    setDetailedTask(task); 
  };
  const handleCloseTaskDetailsModal = () => { console.log("[App.jsx] handleCloseTaskDetailsModal"); setDetailedTask(null); };
  
  const handleOpenEditProjectModal = (project) => { console.log(`[App.jsx] handleOpenEditProjectModal for project: ${project.id}`); setEditingProject(project); };
  const handleCloseEditProjectModal = () => { console.log("[App.jsx] handleCloseEditProjectModal"); setEditingProject(null); };
  const handleOpenDeleteProjectModal = (project) => { console.log(`[App.jsx] handleOpenDeleteProjectModal for project: ${project.id}`); const hasTasks = Object.values(state.tasks || {}).flat().some(taskItem => taskItem.type === 'task' && taskItem.projectId === project.id); setHasOutstandingTasksForDelete(hasTasks); setProjectToDelete(project); };
  const handleCloseDeleteProjectModal = () => { console.log("[App.jsx] handleCloseDeleteProjectModal"); setProjectToDelete(null); };
  
  const handleSaveNewProject = (title, color) => { console.log("[App.jsx] handleSaveNewProject"); dispatch({ type: 'ADD_PROJECT', payload: { title, color } }); handleCloseAddProjectModal(); };
  const handleSaveNewTask = (title, projectId, projectColor) => { console.log("[App.jsx] handleSaveNewTask"); dispatch({ type: 'ADD_TASK', payload: { title, projectId, projectColor, notes: '' } }); handleCloseAddTaskModal(); }; 
  
  const handleSaveEditedProject = (projectId, newTitle, newColor) => { console.log("[App.jsx] handleSaveEditedProject"); dispatch({ type: 'EDIT_PROJECT', payload: { projectId, newTitle, newColor } }); handleCloseEditProjectModal(); };
  const confirmDeleteEmptyProject = (project) => { console.log("[App.jsx] confirmDeleteEmptyProject"); dispatch({ type: 'DELETE_PROJECT', payload: project }); handleCloseDeleteProjectModal(); };
  
  const handleSaveTaskDetails = (taskId, taskData) => { 
    console.log(`[App.jsx] handleSaveTaskDetails for task ID: ${taskId}`);
    dispatch({ type: 'EDIT_TASK', payload: { taskId, taskData } }); 
    handleCloseTaskDetailsModal();
  };
  const handleSaveEditedTask = (taskId, taskData) => { 
    console.log(`[App.jsx] handleSaveEditedTask for task ID: ${taskId}`);
    dispatch({ type: 'EDIT_TASK', payload: { taskId, taskData } });
    handleCloseEditTaskModal();
  };

  const handleDeleteTaskAction = (task) => { console.log(`[App.jsx] handleDeleteTaskAction for task: ${task.id}`); dispatch({ type: 'DELETE_TASK', payload: task }); };
  const handleCompleteTaskAction = (task) => { console.log(`[App.jsx] handleCompleteTaskAction for task: ${task.id}`); dispatch({ type: 'COMPLETE_TASK', payload: task }); };
  const handleRestoreTaskAction = (deletedTaskRecord) => { console.log(`[App.jsx] handleRestoreTaskAction for task: ${deletedTaskRecord.task.id}`); dispatch({ type: 'RESTORE_TASK', payload: deletedTaskRecord }); };
  const handleMarkIncompleteAction = (completedTaskRecord) => { console.log(`[App.jsx] handleMarkIncompleteAction for task: ${completedTaskRecord.task.id}`); dispatch({ type: 'MARK_INCOMPLETE', payload: completedTaskRecord }); };
  const handlePermanentDeleteTaskAction = (taskId) => { console.log(`[App.jsx] handlePermanentDeleteTaskAction for task ID: ${taskId}`); dispatch({ type: 'PERMANENT_DELETE_TASK', payload: taskId }); };

  function handleDragStart(event) {
    const { active } = event;
    const type = active.data.current?.type;
    console.log(`[App.jsx] handleDragStart - Active ID: ${active.id}, Type: ${type}`);
    if (type === 'project' && active.data.current?.project) {
      setActiveDragItem({ type: 'project', data: active.data.current.project });
    } else if (type === 'task' && active.data.current?.task) {
      setActiveDragItem({ type: 'task', data: active.data.current.task });
    } else {
      setActiveDragItem(null);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveDragItem(null);
    console.log(`[App.jsx] handleDragEnd - Active ID: ${active.id}, Over ID: ${over ? over.id : 'null'}`);
    if (!over) { console.log("[App.jsx] Drag ended outside a droppable."); return; }

    const activeId = active.id;
    const overId = over.id;
    const activeType = active.data.current?.type;
    const activeOriginalColumnId = active.data.current?.originalColumnId;
    const overColumnId = over.data.current?.columnId || over.data.current?.originalColumnId || over.id;

    console.log(`[App.jsx] DragEnd Details - Active Type: ${activeType}, Active Original Column: ${activeOriginalColumnId}, Over Column: ${overColumnId}`);

    if (!activeOriginalColumnId || !overColumnId) {
        console.warn("[App.jsx] DragEnd: Missing active or over container/column information.");
        return;
    }

    if (activeType === 'project') {
      if (activeOriginalColumnId === 'master' && overColumnId === 'master') {
        if (activeId !== overId || (over.data.current?.type === 'column' && overId === 'master')) {
          console.log(`[App.jsx] Dispatching MOVE_PROJECT: activeId=${activeId}, overId=${overId}`);
          dispatch({ type: 'MOVE_PROJECT', payload: { activeId, overId } });
        } else {
          console.log("[App.jsx] MOVE_PROJECT skipped (dropped on self or no change).");
        }
      }
    } else if (activeType === 'task') {
      const task = active.data.current?.task;
      if (!task) { console.error("[App.jsx] DragEnd: Task data missing from active item."); return; }
      
      if (activeId === overId && activeOriginalColumnId === overColumnId && over.data.current?.type === 'task') {
          console.log("[App.jsx] MOVE_TASK skipped (task dropped on itself in same column).");
          return;
      }
      console.log(`[App.jsx] Dispatching MOVE_TASK: activeId=${activeId}, overId=${overId}, activeContainer=${activeOriginalColumnId}, overContainer=${overColumnId}, taskProjectId=${task.projectId}`);
      dispatch({
        type: 'MOVE_TASK',
        payload: { activeId, overId, activeContainer: activeOriginalColumnId, overContainer: overColumnId, taskProjectId: task.projectId },
      });
    }
  }
  
  const allMasterTasksFlat = state.tasks?.master?.filter(item => item.type === 'task') || [];

  const taskContextMenuActions = [
    { label: 'Edit', handler: handleOpenEditTaskModal, icon: <Edit2 size={14} />, className: 'edit-btn' },
    { label: 'Details / Notes', handler: handleOpenTaskDetailsModal, icon: <FileText size={14} /> }, 
    { label: 'Delete', handler: handleDeleteTaskAction, icon: <TrashIcon size={14} />, className: 'delete-btn' },
    { label: 'Complete', handler: handleCompleteTaskAction, icon: <CheckIcon size={14} />, className: 'complete-btn' },
  ];

  const projectContextMenuActions = [
    { label: 'Edit Project', handler: handleOpenEditProjectModal, icon: <Edit2 size={14} />, className: 'edit-btn' },
    { label: 'Add Task to Project', handler: (project) => handleOpenAddTaskModal(project.id), icon: <ListPlus size={14}/> },
    { label: 'Delete Project', handler: handleOpenDeleteProjectModal, icon: <TrashIcon size={14} />, className: 'delete-btn delete-project-btn' },
  ];

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="app">
        <AppHeader
          onOpenAddProjectModal={handleOpenAddProjectModal}
          onOpenAddTaskModal={() => handleOpenAddTaskModal()}
          onShowCompletedTasks={() => setShowCompletedTasks(true)}
          onShowRecycleBin={() => setShowRecycleBin(true)}
          recycleBinCount={state.deletedTasks?.length || 0}
        />
        <div className="planner-container">
          <Column
            id="master"
            title="Master Tasks"
            items={state.projectDefinitions || []} 
            allTasksForMaster={allMasterTasksFlat} 
            projectDefinitions={state.projectDefinitions || []} 
            isMaster={true}
            onProjectContextMenu={handleProjectContextMenu}
            onTaskContextMenu={handleTaskContextMenu}
            onTaskClick={handleOpenTaskDetailsModal} 
          />
          <div className="week-columns">
            {DAYS.map(day => (
              <Column
                key={day}
                id={day.toLowerCase()}
                title={day}
                items={state.tasks[day.toLowerCase()] || []} 
                isMaster={false}
                onTaskContextMenu={handleTaskContextMenu}
                onTaskClick={handleOpenTaskDetailsModal} 
              />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDragItem ? ( activeDragItem.type === 'project' ? <ProjectHeader project={activeDragItem.data} /> : activeDragItem.type === 'task' ? <TaskCard task={activeDragItem.data} /> : null ) : null}
        </DragOverlay>
        <AppContextMenu menuData={taskContextMenu} actions={taskContextMenuActions} onClose={() => setTaskContextMenu(p => ({ ...p, visible: false }))} />
        <AppContextMenu menuData={projectContextMenu} actions={projectContextMenuActions} onClose={() => setProjectContextMenu(p => ({ ...p, visible: false }))} />
        
        {showAddTaskModal && <AddTaskModal projectDefinitions={state.projectDefinitions || []} onSave={handleSaveNewTask} onCancel={handleCloseAddTaskModal} initialProjectId={initialProjectIdForModal} />}
        {editingTask && <EditTaskModal task={editingTask} projectDefinitions={state.projectDefinitions || []} onSave={handleSaveEditedTask} onCancel={handleCloseEditTaskModal} />}
        {detailedTask && <TaskDetailsModal task={detailedTask} projectDefinitions={state.projectDefinitions || []} onSave={handleSaveTaskDetails} onCancel={handleCloseTaskDetailsModal} />}
        {editingProject && <EditProjectModal project={editingProject} onSave={handleSaveEditedProject} onCancel={handleCloseEditProjectModal} />}
        {showAddProjectModal && <AddProjectModal onSave={handleSaveNewProject} onCancel={handleCloseAddProjectModal} />}
        {projectToDelete && <ConfirmDeleteProjectModal project={projectToDelete} hasOutstandingTasks={hasOutstandingTasksForDelete} onConfirmDeleteEmpty={confirmDeleteEmptyProject} onCancel={handleCloseDeleteProjectModal} />}
        {showCompletedTasks && <CompletedTasksModal completedTasks={state.completedTasks || []} projectDefinitions={state.projectDefinitions || []} onMarkIncomplete={handleMarkIncompleteAction} onClose={() => setShowCompletedTasks(false)} />}
        {showRecycleBin && <RecycleBinModal deletedTasks={state.deletedTasks || []} onRestore={handleRestoreTaskAction} onPermanentDelete={handlePermanentDeleteTaskAction} onClose={() => setShowRecycleBin(false)} />}
      </div>
    </DndContext>
  );
}
export default App;

