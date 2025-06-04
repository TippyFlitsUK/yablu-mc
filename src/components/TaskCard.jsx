import React from 'react';
import { getProjectColorClass } from '../utils/helpers';

function TaskCard({ task, onContextMenu }) {
  const isSubTask = task.type === 'task' && task.projectId; // Assuming subtasks might have specific styling based on this
  const projectClass = getProjectColorClass(task.projectColor);

  return (
    <div
      onContextMenu={onContextMenu}
      className={`task-card ${isSubTask ? 'sub-task' : ''} ${projectClass}`}
    >
      <div className="task-title">{task.title}</div>
    </div>
  );
}

export default TaskCard;
