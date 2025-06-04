import React from 'react';
import { getProjectColorClass } from '../utils/helpers';
import { FileText } from 'lucide-react'; // Icon for notes

// onTaskClick prop is removed as SortableTaskCard now handles the click
function TaskCard({ task }) {
  if (!task) {
    return null; 
  }

  const isSubTask = task.type === 'task' && task.projectId;
  const projectClass = getProjectColorClass(task.projectColor);
  // Check if notes exist and are not just empty HTML (e.g. <p><br></p> or just spaces)
  const hasNotes = task.notes && task.notes.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;

  return (
    <div
      className={`task-card ${isSubTask ? 'sub-task' : ''} ${projectClass}`}
      // onClick handler removed from here
      style={{ position: 'relative', cursor: 'pointer' }} // Keep pointer cursor for visual cue
    >
      <div className="task-title">{task.title}</div>
      {hasNotes && (
        <FileText 
          size={14} 
          className="task-notes-icon" 
          title="This task has notes" 
        />
      )}
    </div>
  );
}

export default TaskCard;

