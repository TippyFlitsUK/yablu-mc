import React from 'react';
import ProjectHeader from './ProjectHeader';
// DND Kit imports
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskCard from './SortableTaskCard'; 

// The Column component now acts as a droppable area and a sortable context for tasks.
// It receives 'id' (unique identifier for the column), 'title', 'items' (tasks and projects),
// 'isMaster' flag, and context menu handlers.
function Column({ id, title, items, isMaster = false, onProjectContextMenu, onTaskContextMenu }) {
  
  const { setNodeRef, isOver } = useDroppable({
    id: id, 
  });

  const taskItems = items.filter(item => item.type === 'task');
  const taskIds = taskItems.map(item => item.id); 

  const columnClassName = `day-column ${isMaster ? 'master-tasks-column' : ''} ${isOver ? 'droppable-highlight' : ''}`;

  return (
    <div ref={setNodeRef} className={columnClassName}>
      <div className="day-header">{title}</div>
      
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {items.map(item => {
            if (item.type === 'project') {
              return (
                <ProjectHeader
                  key={item.id}
                  project={item}
                  onContextMenu={isMaster ? (e) => onProjectContextMenu(e, item) : undefined}
                />
              );
            } else if (item.type === 'task') {
              return (
                <SortableTaskCard
                  key={item.id}
                  task={item}
                  onContextMenu={onTaskContextMenu} 
                  columnId={id} // Pass the column's ID here
                />
              );
            }
            return null; 
          })}
        </div>
      </SortableContext>
    </div>
  );
}

export default Column;

