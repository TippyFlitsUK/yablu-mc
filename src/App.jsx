import React, { useState, useEffect, useReducer, useRef } from 'react';
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
import GoogleDriveExportModal from './components/GoogleDriveExportModal';
import TaskCard from './components/TaskCard';
import ProjectHeader from './components/ProjectHeader'; 

import { appReducer, initialAppState } from './reducers/appReducer';
import dataService from './services/dataService';
import gdriveService from './services/gdriveService';
import { DAYS } from './utils/constants';

import {
  DndContext,
  PointerSensor,
  TouchSensor,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const [showGoogleDriveExportModal, setShowGoogleDriveExportModal] = useState(false);
  const [taskContextMenu, setTaskContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [projectContextMenu, setProjectContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [activeDragItem, setActiveDragItem] = useState(null);
  const scrollAnimationRef = useRef(null);
  const lastScrollTime = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, 
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    async function initializeApp() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await dataService.initializeData();
        dispatch({
          type: 'INITIALIZE_STATE',
          payload: {
            projectDefinitions: data.projectDefinitions || [],
            tasks: data.tasks || { master: [] },
            deletedTasks: data.deletedTasks || [],
            completedTasks: data.completedTasks || []
          }
        });
        setIsStateInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }
    initializeApp();
  }, []);


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
  
  const handleSaveNewProject = async (title, color) => { 
    console.log("[App.jsx] handleSaveNewProject"); 
    try {
      const newProject = { id: `project-${Date.now()}`, title, color };
      await dataService.createProject(newProject);
      dispatch({ type: 'ADD_PROJECT', payload: { title, color } }); 
      handleCloseAddProjectModal(); 
    } catch (error) {
      console.error('Failed to create project:', error);
      setError(error.message);
    }
  };
  const handleSaveNewTask = async (title, projectId, projectColor) => { 
    console.log("[App.jsx] handleSaveNewTask"); 
    try {
      const newTask = { id: `task-${Date.now()}`, title, projectId, notes: '', container: 'master' };
      await dataService.createTask(newTask);
      dispatch({ type: 'ADD_TASK', payload: { title, projectId, projectColor, notes: '' } }); 
      handleCloseAddTaskModal(); 
    } catch (error) {
      console.error('Failed to create task:', error);
      setError(error.message);
    }
  }; 
  
  const handleSaveEditedProject = async (projectId, newTitle, newColor) => { 
    console.log("[App.jsx] handleSaveEditedProject"); 
    try {
      await dataService.updateProject(projectId, { title: newTitle, color: newColor });
      dispatch({ type: 'EDIT_PROJECT', payload: { projectId, newTitle, newColor } }); 
      handleCloseEditProjectModal(); 
    } catch (error) {
      console.error('Failed to update project:', error);
      setError(error.message);
    }
  };
  const confirmDeleteEmptyProject = async (project) => { 
    console.log("[App.jsx] confirmDeleteEmptyProject"); 
    try {
      await dataService.deleteProject(project.id);
      dispatch({ type: 'DELETE_PROJECT', payload: project }); 
      handleCloseDeleteProjectModal(); 
    } catch (error) {
      console.error('Failed to delete project:', error);
      setError(error.message);
    }
  };
  
  const handleSaveTaskDetails = async (taskId, taskData) => { 
    console.log(`[App.jsx] handleSaveTaskDetails for task ID: ${taskId}`);
    try {
      await dataService.updateTask(taskId, taskData);
      dispatch({ type: 'EDIT_TASK', payload: { taskId, taskData } }); 
      handleCloseTaskDetailsModal();
    } catch (error) {
      console.error('Failed to update task:', error);
      setError(error.message);
    }
  };
  const handleSaveEditedTask = async (taskId, taskData) => { 
    console.log(`[App.jsx] handleSaveEditedTask for task ID: ${taskId}`);
    try {
      await dataService.updateTask(taskId, taskData);
      dispatch({ type: 'EDIT_TASK', payload: { taskId, taskData } });
      handleCloseEditTaskModal();
    } catch (error) {
      console.error('Failed to update task:', error);
      setError(error.message);
    }
  };

  const handleDeleteTaskAction = async (task) => { 
    console.log(`[App.jsx] handleDeleteTaskAction for task: ${task.id}`); 
    try {
      await dataService.deleteTask(task.id);
      dispatch({ type: 'DELETE_TASK', payload: task }); 
    } catch (error) {
      console.error('Failed to delete task:', error);
      setError(error.message);
    }
  };
  const handleCompleteTaskAction = async (task) => { 
    console.log(`[App.jsx] handleCompleteTaskAction for task: ${task.id}`); 
    try {
      await dataService.completeTask(task.id);
      dispatch({ type: 'COMPLETE_TASK', payload: task }); 
    } catch (error) {
      console.error('Failed to complete task:', error);
      setError(error.message);
    }
  };
  const handleRestoreTaskAction = async (deletedTaskRecord) => { 
    console.log(`[App.jsx] handleRestoreTaskAction for task: ${deletedTaskRecord.task.id}`); 
    try {
      await dataService.restoreTask(deletedTaskRecord.task.id);
      dispatch({ type: 'RESTORE_TASK', payload: deletedTaskRecord }); 
    } catch (error) {
      console.error('Failed to restore task:', error);
      setError(error.message);
    }
  };
  const handleMarkIncompleteAction = (completedTaskRecord) => { console.log(`[App.jsx] handleMarkIncompleteAction for task: ${completedTaskRecord.task.id}`); dispatch({ type: 'MARK_INCOMPLETE', payload: completedTaskRecord }); };
  const handlePermanentDeleteTaskAction = (taskId) => { console.log(`[App.jsx] handlePermanentDeleteTaskAction for task ID: ${taskId}`); dispatch({ type: 'PERMANENT_DELETE_TASK', payload: taskId }); };

  const handleScanGoogleDrive = () => {
    console.log("[App.jsx] handleScanGoogleDrive - Opening modal");
    setShowGoogleDriveExportModal(true);
  };

  const handleGoogleDriveExport = async (lookbackHours) => {
    console.log(`[App.jsx] handleGoogleDriveExport with ${lookbackHours} hours`);
    
    try {
      // Sync files with the specified lookback period
      const result = await gdriveService.syncFiles(lookbackHours);
      
      console.log('Google Drive scan completed:', result);
      
      // Always generate export after sync
      await gdriveService.exportForClaude(lookbackHours);
      
      // Return the result data for the modal to display
      return result;
    } catch (error) {
      console.error('Google Drive export failed:', error);
      throw error; // Re-throw to keep modal open on error
    }
  };

  const handleExportData = () => {
    console.log("[App.jsx] handleExportData");
    
    const formatDate = (date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(date));
    };

    const getProjectName = (projectId) => {
      const project = state.projectDefinitions?.find(p => p.id === projectId);
      return project ? project.title : 'Unknown Project';
    };

    let exportData = '# YABLU-MC Task Planner Export\n\n';
    exportData += `Export Date: ${formatDate(new Date())}\n\n`;

    // Projects List
    exportData += '## Projects\n\n';
    if (state.projectDefinitions && state.projectDefinitions.length > 0) {
      state.projectDefinitions.forEach(project => {
        exportData += `- **${project.title}** (Color: ${project.color})\n`;
      });
    } else {
      exportData += '*No projects defined*\n';
    }
    exportData += '\n';

    exportData += '## Task Planner Layout\n\n';

    // Master Tasks Column
    exportData += '### Master Tasks (Unscheduled)\n\n';
    const masterTasks = state.tasks?.master?.filter(item => item.type === 'task') || [];
    if (masterTasks.length > 0) {
      masterTasks.forEach(task => {
        const projectName = getProjectName(task.projectId);
        exportData += `- **${task.title}** (${projectName})\n`;
        if (task.notes && task.notes.trim()) {
          // Convert HTML notes to plain text for markdown export
          const notesText = task.notes.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
          if (notesText) {
            exportData += `  *Notes: ${notesText}*\n`;
          }
        }
      });
    } else {
      exportData += '*No unscheduled tasks*\n';
    }
    exportData += '\n';

    // Weekday Columns
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Weekend'];
    days.forEach(day => {
      exportData += `### ${day}\n\n`;
      const dayTasks = state.tasks?.[day.toLowerCase()]?.filter(item => item.type === 'task') || [];
      if (dayTasks.length > 0) {
        dayTasks.forEach(task => {
          const projectName = getProjectName(task.projectId);
          exportData += `- **${task.title}** (${projectName})\n`;
          if (task.notes && task.notes.trim()) {
            // Convert HTML notes to plain text for markdown export
            const notesText = task.notes.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            if (notesText) {
              exportData += `  *Notes: ${notesText}*\n`;
            }
          }
        });
      } else {
        exportData += `*No tasks scheduled for ${day}*\n`;
      }
      exportData += '\n';
    });

    // Completed Tasks
    exportData += '## Completed Tasks\n\n';
    if (state.completedTasks && state.completedTasks.length > 0) {
      state.completedTasks.forEach(completedRecord => {
        const task = completedRecord.task;
        const projectName = getProjectName(task.projectId);
        const completedDate = formatDate(completedRecord.completedAt);
        exportData += `- **${task.title}** (${projectName}) - Completed: ${completedDate}\n`;
        if (task.notes && task.notes.trim()) {
          // Convert HTML notes to plain text for markdown export
          const notesText = task.notes.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
          if (notesText) {
            exportData += `  *Notes: ${notesText}*\n`;
          }
        }
      });
    } else {
      exportData += '*No completed tasks*\n';
    }

    // Create and download file
    const blob = new Blob([exportData], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yablu-mc-export-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
    
    // Enable auto-scroll during drag on mobile
    if (window.innerWidth <= 800) {
      const plannerContainer = document.querySelector('.planner-container');
      if (plannerContainer) {
        plannerContainer.style.scrollBehavior = 'auto';
      }
    }
  }

  function handleDragMove(event) {
    // Auto-scroll on mobile during drag with better throttling
    if (window.innerWidth <= 800) {
      const now = Date.now();
      if (now - lastScrollTime.current < 50) return; // Throttle to max 20fps
      
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      
      scrollAnimationRef.current = requestAnimationFrame(() => {
        lastScrollTime.current = now;
        
        const plannerContainer = document.querySelector('.planner-container');
        if (!plannerContainer) return;
        
        const containerRect = plannerContainer.getBoundingClientRect();
        const scrollThreshold = 120;
        const scrollSpeed = 2;
        
        // Use the actual mouse/touch position instead of drag element position
        const currentPointer = event.active.rect.current.translated;
        if (!currentPointer) return;
        
        const pointerX = currentPointer.left + (currentPointer.width / 2);
        
        // Only scroll if we're at the edges and can actually scroll
        if (pointerX < containerRect.left + scrollThreshold && plannerContainer.scrollLeft > 0) {
          plannerContainer.scrollBy({ left: -scrollSpeed, behavior: 'auto' });
        } else if (pointerX > containerRect.right - scrollThreshold) {
          const maxScroll = plannerContainer.scrollWidth - plannerContainer.clientWidth;
          if (plannerContainer.scrollLeft < maxScroll) {
            plannerContainer.scrollBy({ left: scrollSpeed, behavior: 'auto' });
          }
        }
      });
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveDragItem(null);
    
    // Clear any pending scroll animation
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
    
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
          try {
            // Update UI immediately for responsiveness
            dispatch({ type: 'MOVE_PROJECT', payload: { activeId, overId } });
            
            // Persist the new order to the database
            const updatedProjectDefinitions = [...state.projectDefinitions];
            const oldIndex = updatedProjectDefinitions.findIndex(p => p.id === activeId);
            let newIndex = updatedProjectDefinitions.findIndex(p => p.id === overId);
            
            if (oldIndex !== -1) {
              if (activeId === overId) newIndex = oldIndex; 
              else if (overId === 'master' || newIndex === -1) { 
                newIndex = updatedProjectDefinitions.length; 
              }
              
              // Calculate new project order
              const reorderedProjects = [...updatedProjectDefinitions];
              const [movedProject] = reorderedProjects.splice(oldIndex, 1);
              reorderedProjects.splice(newIndex, 0, movedProject);
              const projectIds = reorderedProjects.map(p => p.id);
              
              // Persist to database
              await dataService.reorderProjects(projectIds);
            }
          } catch (error) {
            console.error('Failed to move project:', error);
            setError(error.message);
          }
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
      try {
        // Prepare move data with proper ordering information
        const moveData = {
          container: overColumnId,
          projectId: task.projectId
        };
        
        // Copy the EXACT logic from localStorage version
        if (overId !== overColumnId && over.data.current?.type === 'task') {
          // Find the exact position of the target task
          const targetTasks = state.tasks[overColumnId] || [];
          const targetIndex = targetTasks.findIndex(item => item.id === overId);
          if (targetIndex !== -1) {
            moveData.orderIndex = targetIndex;
          }
        }
        
        // Handle task move with API
        await dataService.moveTask(activeId, moveData);
        dispatch({
          type: 'MOVE_TASK',
          payload: { activeId, overId, activeContainer: activeOriginalColumnId, overContainer: overColumnId, taskProjectId: task.projectId },
        });
      } catch (error) {
        console.error('Failed to move task:', error);
        setError(error.message);
      }
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

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Connecting to database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
      <div className="app">
        <AppHeader
          onOpenAddProjectModal={handleOpenAddProjectModal}
          onOpenAddTaskModal={() => handleOpenAddTaskModal()}
          onShowCompletedTasks={() => setShowCompletedTasks(true)}
          onShowRecycleBin={() => setShowRecycleBin(true)}
          onExportData={handleExportData}
          onScanGoogleDrive={handleScanGoogleDrive}
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
        {showGoogleDriveExportModal && <GoogleDriveExportModal onExport={handleGoogleDriveExport} onCancel={() => setShowGoogleDriveExportModal(false)} />}
      </div>
    </DndContext>
  );
}
export default App;

