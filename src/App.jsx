import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Edit2, Trash2, X, RotateCcw, Trash, RefreshCw, Check, CheckCircle, Archive } from 'lucide-react'
import './App.css'

// Real task data from user's current list
const initialTasks = [
  {
    id: 'project-1',
    title: 'TODAY - Urgent Tasks',
    type: 'project',
    color: '#ef4444',
    children: [
      { id: 'task-1', title: 'Reach out to non-participating F3 SPs', type: 'task', projectId: 'project-1', projectColor: '#ef4444' },
      { id: 'task-2', title: 'Add Filecoin docs', type: 'task', projectId: 'project-1', projectColor: '#ef4444' },
      { id: 'task-3', title: 'Create RTs and quotes', type: 'task', projectId: 'project-1', projectColor: '#ef4444' },
      { id: 'task-4', title: 'PDP resources index', type: 'task', projectId: 'project-1', projectColor: '#ef4444' },
      { id: 'task-5', title: 'Finish skeleton', type: 'task', projectId: 'project-1', projectColor: '#ef4444' },
      { id: 'task-6', title: 'FDS show reels and clips', type: 'task', projectId: 'project-1', projectColor: '#ef4444' },
      { id: 'task-7', title: 'FDS 6 comms plan', type: 'task', projectId: 'project-1', projectColor: '#ef4444' },
      { id: 'task-8', title: 'Batching comms', type: 'task', projectId: 'project-1', projectColor: '#ef4444' },
      { id: 'task-9', title: 'Contact Jen - Enrolled and getting deals', type: 'task', projectId: 'project-1', projectColor: '#ef4444' },
      { id: 'task-10', title: 'Ian - How do they want to be included', type: 'task', projectId: 'project-1', projectColor: '#ef4444' }
    ]
  },
  {
    id: 'project-2',
    title: 'SPX Project',
    type: 'project',
    color: '#f97316',
    children: [
      { id: 'task-11', title: 'Start planning assignments', type: 'task', projectId: 'project-2', projectColor: '#f97316' },
      { id: 'task-12', title: 'Recruit', type: 'task', projectId: 'project-2', projectColor: '#f97316' },
      { id: 'task-13', title: 'Provide contracting info', type: 'task', projectId: 'project-2', projectColor: '#f97316' },
      { id: 'task-14', title: 'Send X post for noob SP', type: 'task', projectId: 'project-2', projectColor: '#f97316' },
      { id: 'task-15', title: 'Add deletion issue FAO Mayank', type: 'task', projectId: 'project-2', projectColor: '#f97316' }
    ]
  },
  {
    id: 'project-3',
    title: 'TO SCHEDULE',
    type: 'project',
    color: '#3b82f6',
    children: [
      { id: 'task-16', title: 'Push Jen on LIT', type: 'task', projectId: 'project-3', projectColor: '#3b82f6' },
      { id: 'task-17', title: 'Post NV25 blog post', type: 'task', projectId: 'project-3', projectColor: '#3b82f6' },
      { id: 'task-18', title: 'Molly surveys', type: 'task', projectId: 'project-3', projectColor: '#3b82f6' },
      { id: 'task-19', title: 'Finalise RetroPGF', type: 'task', projectId: 'project-3', projectColor: '#3b82f6' },
      { id: 'task-20', title: 'Email FWS domain owners', type: 'task', projectId: 'project-3', projectColor: '#3b82f6' },
      { id: 'task-21', title: 'Dust wallet allocation', type: 'task', projectId: 'project-3', projectColor: '#3b82f6' },
      { id: 'task-22', title: 'Play with LIT slides', type: 'task', projectId: 'project-3', projectColor: '#3b82f6' },
      { id: 'task-23', title: 'FilOz newsletter', type: 'task', projectId: 'project-3', projectColor: '#3b82f6' },
      { id: 'task-24', title: 'Blog post on Retro PGF', type: 'task', projectId: 'project-3', projectColor: '#3b82f6' }
    ]
  },
  {
    id: 'project-4',
    title: 'Core Devs & Documentation',
    type: 'project',
    color: '#22c55e',
    children: [
      { id: 'task-25', title: 'Respond with Orjan - Filecoin Core Devs', type: 'task', projectId: 'project-4', projectColor: '#22c55e' },
      { id: 'task-26', title: 'Implementers group', type: 'task', projectId: 'project-4', projectColor: '#22c55e' },
      { id: 'task-27', title: 'Functions that need to be achieved', type: 'task', projectId: 'project-4', projectColor: '#22c55e' },
      { id: 'task-28', title: 'Protocol Office Hours one-pager', type: 'task', projectId: 'project-4', projectColor: '#22c55e' },
      { id: 'task-29', title: 'Generate AI doc for colo takeaways', type: 'task', projectId: 'project-4', projectColor: '#22c55e' }
    ]
  }
]

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Weekend']

// Color mapping helper
const getProjectClass = (color) => {
  const colorMap = {
    '#ef4444': 'project-red',
    '#22c55e': 'project-green', 
    '#3b82f6': 'project-blue',
    '#f97316': 'project-orange'
  }
  return colorMap[color] || ''
}

// Project Header Component
function ProjectHeader({ project }) {
  return (
    <div className={`project-header ${getProjectClass(project.color)}`}>
      <div className="project-title">{project.title}</div>
    </div>
  )
}

// Simple Task Card Component
function SortableTaskCard({ task, onEdit, onDelete, onComplete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isSubTask = task.type === 'task' && task.projectId
  const projectClass = getProjectClass(task.projectColor)

  const handleEdit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit(task)
  }

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(task)
  }

  const handleComplete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onComplete(task)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isSubTask ? 'sub-task' : ''} ${projectClass}`}
    >
      <div className="task-title">{task.title}</div>
      <div className="task-buttons">
        <button 
          className="task-btn delete-btn"
          onClick={handleDelete}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Trash2 size={14} />
        </button>
        <button 
          className="task-btn edit-btn" 
          onClick={handleEdit}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Edit2 size={14} />
        </button>
        <button 
          className="task-btn complete-btn" 
          onClick={handleComplete}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          title="Mark as complete"
        >
          <Check size={14} />
        </button>
      </div>
    </div>
  )
}

// Task Card for Drag Overlay
function TaskCard({ task }) {
  const isSubTask = task.type === 'task' && task.projectId
  const projectClass = getProjectClass(task.projectColor)

  return (
    <div className={`task-card dragging ${isSubTask ? 'sub-task' : ''} ${projectClass}`}>
      <div className="task-title">{task.title}</div>
    </div>
  )
}

// Completed Tasks Modal Component
function CompletedTasksModal({ completedTasks, onMarkIncomplete, onClose, projectOptions }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const getProjectTitle = (projectId) => {
    const project = projectOptions.find(p => p.id === projectId)
    return project ? project.title : 'Unknown Project'
  }

  const sortedTasks = completedTasks.sort((a, b) => b.completedAt - a.completedAt)

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
                {sortedTasks.map((completedTask) => (
                  <div 
                    key={completedTask.task.id} 
                    className={`completed-task-item ${getProjectClass(completedTask.task.projectColor)}`}
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
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Recycle Bin Modal Component
function RecycleBinModal({ deletedTasks, onRestore, onPermanentDelete, onClose }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysRemaining = (deletedAt) => {
    const daysSinceDeleted = Math.floor((Date.now() - deletedAt) / (1000 * 60 * 60 * 24))
    return Math.max(0, 30 - daysSinceDeleted)
  }

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
  )
}

// Edit Modal Component
function EditModal({ task, onSave, onCancel, projectOptions }) {
  const [title, setTitle] = useState(task.title)
  const [selectedProject, setSelectedProject] = useState(task.projectId || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (title.trim()) {
      const project = projectOptions.find(p => p.id === selectedProject)
      onSave(task.id, {
        title: title.trim(),
        projectId: selectedProject,
        projectColor: project?.color || task.projectColor
      })
    }
  }

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
            <label>Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="modal-input"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Project</label>
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              className="modal-select"
            >
              {projectOptions.map(project => (
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
  )
}

// Droppable Column Component
function DroppableColumn({ id, title, tasks, isMaster = false, onEdit, onDelete, onComplete }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div ref={setNodeRef} className={`day-column ${isOver && !isMaster ? 'drag-over' : ''}`}>
      <div className="day-header">{title}</div>
      <div className="task-list">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => {
            if (task.type === 'project') {
              return <ProjectHeader key={task.id} project={task} />
            } else {
              return <SortableTaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onComplete={onComplete} />
            }
          })}
        </SortableContext>
      </div>
    </div>
  )
}

// Storage keys
const STORAGE_KEYS = {
  TASKS: 'yablu-mc-tasks',
  DELETED_TASKS: 'yablu-mc-deleted-tasks',
  COMPLETED_TASKS: 'yablu-mc-completed-tasks'
}

// Helper functions for localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
    return defaultValue
  }
}

function App() {
  const [tasks, setTasks] = useState(() => {
    // Try to load from localStorage first
    const savedTasks = loadFromStorage(STORAGE_KEYS.TASKS)
    if (savedTasks) {
      return savedTasks
    }

    // If no saved data, use initial data
    const initialState = { master: [] }
    
    // Add all projects and their tasks to master list
    initialTasks.forEach(project => {
      initialState.master.push(project)
      initialState.master.push(...project.children)
    })
    
    // Initialize empty day arrays
    days.forEach(day => {
      initialState[day.toLowerCase()] = []
    })
    
    return initialState
  })

  const [activeTask, setActiveTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [deletedTasks, setDeletedTasks] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.DELETED_TASKS) || []
  })
  const [completedTasks, setCompletedTasks] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.COMPLETED_TASKS) || []
  })
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)

  // Get project options for modal
  const projectOptions = initialTasks

  // Clean up old deleted tasks (30+ days) on component mount
  useEffect(() => {
    const cleanupOldTasks = () => {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      setDeletedTasks(prev => {
        const filtered = prev.filter(deletedTask => deletedTask.deletedAt > thirtyDaysAgo)
        if (filtered.length !== prev.length) {
          saveToStorage(STORAGE_KEYS.DELETED_TASKS, filtered)
        }
        return filtered
      })
    }
    cleanupOldTasks()
  }, [])

  // Save to localStorage whenever tasks change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TASKS, tasks)
  }, [tasks])

  // Save to localStorage whenever deleted tasks change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DELETED_TASKS, deletedTasks)
  }, [deletedTasks])

  // Save to localStorage whenever completed tasks change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.COMPLETED_TASKS, completedTasks)
  }, [completedTasks])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Simple collision detection
  const customCollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)
    return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args)
  }

  // Find which container and index a task is in
  const findTaskLocation = (taskId) => {
    for (const [containerName, containerTasks] of Object.entries(tasks)) {
      const taskIndex = containerTasks.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        return { container: containerName, index: taskIndex }
      }
    }
    return null
  }

  // Edit task functions
  const handleEditTask = (task) => {
    setEditingTask(task)
  }

  const handleSaveTask = (taskId, taskData) => {
    setTasks(prevTasks => {
      const updatedTasks = {}
      for (const [containerName, containerTasks] of Object.entries(prevTasks)) {
        updatedTasks[containerName] = containerTasks.map(task => 
          task.id === taskId 
            ? { ...task, ...taskData }
            : task
        )
      }
      return updatedTasks
    })
    setEditingTask(null)
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
  }

  // Delete task functions
  const handleDeleteTask = (task) => {
    const location = findTaskLocation(task.id)
    if (!location) return

    // Add to deleted tasks with metadata
    const deletedTask = {
      task,
      deletedAt: Date.now(),
      originalContainer: location.container,
      originalIndex: location.index
    }

    setDeletedTasks(prev => [...prev, deletedTask])

    // Remove from current tasks
    setTasks(prevTasks => {
      const updatedTasks = {}
      for (const [containerName, containerTasks] of Object.entries(prevTasks)) {
        updatedTasks[containerName] = containerTasks.filter(t => t.id !== task.id)
      }
      return updatedTasks
    })
  }

  // Restore task from recycle bin
  const handleRestoreTask = (deletedTask) => {
    const { task, originalContainer, originalIndex } = deletedTask
    
    // Remove from deleted tasks first
    setDeletedTasks(prev => prev.filter(dt => dt.task.id !== task.id))
    
    // Then add back to tasks
    setTasks(prevTasks => {
      const updatedTasks = {}
      // Create fresh copy of all containers
      for (const [key, value] of Object.entries(prevTasks)) {
        updatedTasks[key] = [...value]
      }
      
      // Try to restore to original position, or add to end if position doesn't exist
      if (updatedTasks[originalContainer]) {
        const targetIndex = Math.min(originalIndex, updatedTasks[originalContainer].length)
        updatedTasks[originalContainer].splice(targetIndex, 0, task)
      } else {
        // If original container doesn't exist, add to master
        updatedTasks.master.push(task)
      }
      
      return updatedTasks
    })
  }

  // Complete task functions
  const handleCompleteTask = (task) => {
    const location = findTaskLocation(task.id)
    if (!location) return

    // Add to completed tasks with metadata
    const completedTask = {
      task,
      completedAt: Date.now(),
      originalContainer: location.container,
      originalIndex: location.index
    }

    setCompletedTasks(prev => [...prev, completedTask])

    // Remove from current tasks
    setTasks(prevTasks => {
      const updatedTasks = {}
      for (const [containerName, containerTasks] of Object.entries(prevTasks)) {
        updatedTasks[containerName] = containerTasks.filter(t => t.id !== task.id)
      }
      return updatedTasks
    })
  }

  // Mark task as incomplete (restore from completed)
  const handleMarkIncomplete = (completedTask) => {
    const { task, originalContainer, originalIndex } = completedTask
    
    // Remove from completed tasks first
    setCompletedTasks(prev => prev.filter(ct => ct.task.id !== task.id))
    
    // Then add back to tasks
    setTasks(prevTasks => {
      const updatedTasks = {}
      // Create fresh copy of all containers
      for (const [key, value] of Object.entries(prevTasks)) {
        updatedTasks[key] = [...value]
      }
      
      // Try to restore to original position, or add to end if position doesn't exist
      if (updatedTasks[originalContainer]) {
        const targetIndex = Math.min(originalIndex, updatedTasks[originalContainer].length)
        updatedTasks[originalContainer].splice(targetIndex, 0, task)
      } else {
        // If original container doesn't exist, add to master
        updatedTasks.master.push(task)
      }
      
      return updatedTasks
    })
  }

  // Permanently delete task
  const handlePermanentDelete = (taskId) => {
    setDeletedTasks(prev => prev.filter(dt => dt.task.id !== taskId))
  }

  function handleDragStart(event) {
    const foundTask = Object.values(tasks).flat().find(task => task.id === event.active.id)
    if (foundTask?.type === 'task') {
      setActiveTask(foundTask)
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveTask(null)

    if (!over || active.id === over.id) return

    // Find source task and container
    let sourceContainer = null
    let draggedTask = null
    let sourceIndex = -1

    for (const [containerName, containerTasks] of Object.entries(tasks)) {
      const taskIndex = containerTasks.findIndex(t => t.id === active.id)
      if (taskIndex !== -1 && containerTasks[taskIndex].type === 'task') {
        sourceContainer = containerName
        draggedTask = containerTasks[taskIndex]
        sourceIndex = taskIndex
        break
      }
    }

    if (!sourceContainer || !draggedTask) return

    // Find target container and position
    let targetContainer = null
    let targetIndex = null

    // Check if dropped on a task
    for (const [containerName, containerTasks] of Object.entries(tasks)) {
      const taskIndex = containerTasks.findIndex(t => t.id === over.id)
      if (taskIndex !== -1) {
        targetContainer = containerName
        targetIndex = taskIndex
        break
      }
    }
    
    // Check if dropped on container directly
    if (!targetContainer) {
      const containerNames = ['master', ...days.map(d => d.toLowerCase())]
      if (containerNames.includes(over.id)) {
        targetContainer = over.id
        targetIndex = tasks[over.id].filter(t => t.type === 'task').length // Always add to end
      }
    }

    if (!targetContainer) return // Remove targetIndex check

    // Update tasks state
    setTasks(prevTasks => {
      const updatedTasks = {}
      for (const [key, value] of Object.entries(prevTasks)) {
        updatedTasks[key] = [...value]
      }

      if (sourceContainer === targetContainer) {
        // Same container - reorder using arrayMove
        if (sourceIndex !== targetIndex) {
          updatedTasks[sourceContainer] = arrayMove(updatedTasks[sourceContainer], sourceIndex, targetIndex)
        }
      } else {
        // Different containers - always add to end
        updatedTasks[sourceContainer] = updatedTasks[sourceContainer].filter(t => t.id !== active.id)
        
        if (targetContainer === 'master' && draggedTask.projectId) {
          // Insert at end of project group in master
          let insertPosition = updatedTasks.master.length
          for (let i = 0; i < updatedTasks.master.length; i++) {
            if (updatedTasks.master[i].id === draggedTask.projectId) {
              insertPosition = i + 1
              while (insertPosition < updatedTasks.master.length && 
                     updatedTasks.master[insertPosition].projectId === draggedTask.projectId) {
                insertPosition++
              }
              break
            }
          }
          updatedTasks.master.splice(insertPosition, 0, draggedTask)
        } else {
          // Always add to end of day column
          updatedTasks[targetContainer].push(draggedTask)
        }
      }

      return updatedTasks
    })
  }

  return (
    <div className="app">
      <div className="header">
        <h1>YABLU-MC</h1>
        <p>Weekly Task Planner</p>
        <div className="header-buttons">
          <button 
            className="completed-tasks-btn"
            onClick={() => setShowCompletedTasks(true)}
            title="Completed Tasks"
          >
            <CheckCircle size={20} />
          </button>
          <button 
            className="recycle-bin-btn"
            onClick={() => setShowRecycleBin(true)}
            title="Recycle Bin"
          >
            <Trash size={20} />
          </button>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="planner-container">
          <DroppableColumn 
            id="master"
            title="Master Tasks"
            tasks={tasks.master}
            isMaster={true}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onComplete={handleCompleteTask}
          />

          <div className="week-columns">
            {days.map(day => (
              <DroppableColumn
                key={day}
                id={day.toLowerCase()}
                title={day}
                tasks={tasks[day.toLowerCase()]}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onComplete={handleCompleteTask}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {editingTask && (
        <EditModal
          task={editingTask}
          onSave={handleSaveTask}
          onCancel={handleCancelEdit}
          projectOptions={projectOptions}
        />
      )}

      {showCompletedTasks && (
        <CompletedTasksModal
          completedTasks={completedTasks}
          onMarkIncomplete={handleMarkIncomplete}
          onClose={() => setShowCompletedTasks(false)}
          projectOptions={projectOptions}
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
  )
}

export default App
