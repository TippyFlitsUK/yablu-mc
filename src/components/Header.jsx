import React from 'react';
import { PlusCircle, CheckCircle, Trash, ListPlus } from 'lucide-react'; // Added ListPlus

function AppHeader({
  onOpenAddProjectModal,
  onOpenAddTaskModal, // New prop
  onShowCompletedTasks,
  onShowRecycleBin,
  recycleBinCount
}) {
  return (
    <div className="app-header">
      <h1>YABLU-MC</h1>
      <p>Weekly Task Planner</p>
      <div className="header-buttons">
        <button
          className="add-new-task-btn header-action-btn" // New button
          onClick={onOpenAddTaskModal}
          title="Add New Task"
        >
          <ListPlus size={20} />
        </button>
        <button
          className="add-new-project-btn header-action-btn"
          onClick={onOpenAddProjectModal}
          title="Add New Project"
        >
          <PlusCircle size={20} />
        </button>
        <button
          className="completed-tasks-btn header-action-btn"
          onClick={onShowCompletedTasks}
          title="Completed Tasks"
        >
          <CheckCircle size={20} />
        </button>
        <button
          className="recycle-bin-btn header-action-btn"
          onClick={onShowRecycleBin}
          title="Recycle Bin"
        >
          <Trash size={20} />
          {recycleBinCount > 0 && <span className="recycle-count">{recycleBinCount}</span>}
        </button>
      </div>
    </div>
  );
}

export default AppHeader;

