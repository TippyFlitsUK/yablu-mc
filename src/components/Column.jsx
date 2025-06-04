import React from 'react';
import ProjectHeader from './ProjectHeader';
import TaskCard from './TaskCard';

function Column({ id, title, items, isMaster = false, onTaskContextMenu, onProjectContextMenu }) {
  return (
    <div className={`day-column ${isMaster ? 'master-tasks-column' : ''}`}>
      <div className="day-header">{title}</div>
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
          } else {
            return (
              <TaskCard
                key={item.id}
                task={item}
                onContextMenu={(e) => onTaskContextMenu(e, item)}
              />
            );
          }
        })}
      </div>
    </div>
  );
}

export default Column;
