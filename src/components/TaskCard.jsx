import React from 'react';
import { getProjectColorClass } from '../utils/helpers';

// The TaskCard component is now simpler, focusing only on displaying the task.
// Draggability and context menu logic are handled by its parent (SortableTaskCard).
function TaskCard({ task }) {
  // If task is not provided, render nothing to avoid errors.
  if (!task) {
    return null; 
  }

  const isSubTask = task.type === 'task' && task.projectId; // Assuming subtasks might have specific styling
  const projectClass = getProjectColorClass(task.projectColor);

  return (
    // The main div no longer has the onContextMenu prop directly.
    // It's handled by SortableTaskCard.
    <div
      className={`task-card ${isSubTask ? 'sub-task' : ''} ${projectClass}`}
    >
      <div className="task-title">{task.title}</div>
      {/* You could add more task details here if needed, like due dates or tags */}
    </div>
  );
}

export default TaskCard;

