import React from 'react';
import SortableProjectHeader from './SortableProjectHeader';
import SortableTaskCard from './SortableTaskCard';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function Column({ 
  id, 
  title, 
  items, 
  allTasksForMaster, 
  // projectDefinitions, // This might be redundant if items for master is projectDefinitions
  isMaster = false, 
  onProjectContextMenu, 
  onTaskContextMenu,
  onTaskClick // Added prop for logging
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id, 
    data: {
      type: 'column',
      columnId: id,
    }
  });

  const primarySortableItemIds = (items || []).map(item => item.id); 

  const columnClassName = `day-column ${isMaster ? 'master-tasks-column' : ''} ${isOver ? 'droppable-highlight' : ''}`;

  const handleTaskCardClick = (task) => {
    console.log(`[Column ${id}] handleTaskCardClick called for task: ${task.id}, title: ${task.title}`);
    if (onTaskClick) {
      console.log(`[Column ${id}] Propagating onTaskClick for task: ${task.id}`);
      onTaskClick(task);
    } else {
      console.log(`[Column ${id}] onTaskClick prop is not defined.`);
    }
  };

  // console.log(`[Column ${id}] Rendering. isMaster: ${isMaster}, items count: ${(items || []).length}`);
  // if (isMaster) console.log(`[Column ${id}] allTasksForMaster count: ${(allTasksForMaster || []).length}`);


  return (
    <div ref={setNodeRef} className={columnClassName}>
      <div className="day-header">{title}</div>
      
      <SortableContext items={primarySortableItemIds} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {isMaster ? (
            (items || []).map(project => { 
              const tasksForThisProject = (allTasksForMaster || [])
                .filter(task => task.projectId === project.id && task.type === 'task');
              const taskIdsForThisProject = tasksForThisProject.map(task => task.id);

              return (
                <React.Fragment key={`project-group-${project.id}`}>
                  <SortableProjectHeader
                    project={project}
                    onContextMenu={onProjectContextMenu}
                    columnId={id} 
                  />
                  {tasksForThisProject.length > 0 && (
                    <SortableContext 
                      items={taskIdsForThisProject} 
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="project-tasks-container" style={{ marginLeft: '20px' }}>
                        {tasksForThisProject.map(task => (
                          <SortableTaskCard
                            key={task.id}
                            task={task}
                            onContextMenu={onTaskContextMenu}
                            columnId={id} 
                            onTaskClick={handleTaskCardClick} // Pass down the click handler
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            (items || []).map(task => {
              if (task.type === 'task') { 
                return (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    onContextMenu={onTaskContextMenu}
                    columnId={id}
                    onTaskClick={handleTaskCardClick} // Pass down the click handler
                  />
                );
              }
              return null;
            })
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default Column;

