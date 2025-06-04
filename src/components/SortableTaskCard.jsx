import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';

// onTaskClick prop is passed from Column.jsx
function SortableTaskCard({ task, onContextMenu, columnId, onTaskClick }) { 
  const {
    attributes,      
    listeners,       
    setNodeRef,      
    transform,       
    transition,      
    isDragging,      
  } = useSortable({ 
    id: task.id,     
    data: { 
      type: 'task',  
      task: task,    
      originalColumnId: columnId, 
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform), 
    transition,                                   
    opacity: isDragging ? 0.7 : 1,               
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.3)' : undefined, 
    zIndex: isDragging ? 100 : 'auto',           
  };

  if (!task) {
    console.log("[SortableTaskCard] Task prop is null, rendering null.");
    return null;
  }

  const handleClick = (e) => {
    console.log(`[SortableTaskCard] handleClick triggered for task: ${task.id}, title: ${task.title}`);
    console.log(`[SortableTaskCard] Event button: ${e.button}, isDragging: ${isDragging}, onTaskClick prop exists: ${!!onTaskClick}`);
    
    // Check if it's a left click (button 0) and not currently dragging
    // Also, ensure onTaskClick is a function.
    if (e.button === 0 && typeof onTaskClick === 'function' && !isDragging) { 
      console.log(`[SortableTaskCard] Conditions met. Calling onTaskClick for task: ${task.id}`);
      onTaskClick(task);
    } else {
      console.log(`[SortableTaskCard] Conditions NOT met. e.button: ${e.button}, typeof onTaskClick: ${typeof onTaskClick}, isDragging: ${isDragging}`);
    }
  };
  
  const handleContextMenu = (e) => {
    console.log(`[SortableTaskCard] handleContextMenu triggered for task: ${task.id}`);
    e.preventDefault(); 
    e.stopPropagation(); 
    if (onContextMenu) {
      console.log(`[SortableTaskCard] Calling onContextMenu for task: ${task.id}`);
      onContextMenu(e, task);
    }
  };

  // console.log(`[SortableTaskCard] Rendering task: ${task.id}, title: ${task.title}, columnId: ${columnId}`);

  return (
    <div
      ref={setNodeRef}                           
      style={style}                              
      {...attributes}                            
      {...listeners}                             
      onClick={handleClick} 
      onContextMenu={handleContextMenu}
    >
      <TaskCard task={task} /> 
    </div>
  );
}

export default SortableTaskCard;

