import { useState } from 'react'
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

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Color mapping helper
const getProjectClass = (color) => {
  const colorMap = {
    '#ef4444': 'project-red',
    '#22c55e': 'project-green', 
    '#3b82f6': 'project-blue'
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
function SortableTaskCard({ task }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isSubTask ? 'sub-task' : ''} ${projectClass}`}
    >
      <div className="task-title">{task.title}</div>
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

// Droppable Column Component
function DroppableColumn({ id, title, tasks }) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div ref={setNodeRef} className="day-column">
      <div className="day-header">{title}</div>
      <div className="task-list">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => {
            if (task.type === 'project') {
              return <ProjectHeader key={task.id} project={task} />
            } else {
              return <SortableTaskCard key={task.id} task={task} />
            }
          })}
        </SortableContext>
      </div>
    </div>
  )
}

function App() {
  const [tasks, setTasks] = useState(() => {
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
          />

          <div className="week-columns">
            {days.map(day => (
              <DroppableColumn
                key={day}
                id={day.toLowerCase()}
                title={day}
                tasks={tasks[day.toLowerCase()]}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default App
