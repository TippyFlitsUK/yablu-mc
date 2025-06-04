import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';

// This component wraps TaskCard to make it sortable.
// It receives the task, the onContextMenu handler, and the ID of its parent column.
function SortableTaskCard({ task, onContextMenu, columnId }) { // Added columnId prop
  const {
    attributes,      
    listeners,       
    setNodeRef,      
    transform,       
    transition,      
    isDragging,      
  } = useSortable({ 
    id: task.id,     
    data: { // Store extra data with the sortable item
      type: 'task',  
      task: task,    
      originalColumnId: columnId, // Explicitly store the column ID here
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform), 
    transition,                                   
    opacity: isDragging ? 0.7 : 1,               
    cursor: 'grab',                              
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.3)' : undefined, 
    zIndex: isDragging ? 100 : 'auto',           
  };

  if (!task) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}                           
      style={style}                              
      {...attributes}                            
      {...listeners}                             
      onContextMenu={(e) => {                    
        if (onContextMenu) {                     
          onContextMenu(e, task);
        }
      }}
    >
      <TaskCard task={task} />
    </div>
  );
}

export default SortableTaskCard;

