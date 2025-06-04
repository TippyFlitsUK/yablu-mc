import React from 'react';
import { PlusCircle, CheckCircle, Trash } from 'lucide-react';

function AppHeader({ onOpenAddProjectModal, onShowCompletedTasks, onShowRecycleBin, recycleBinCount }) {
  return (
    <div className="app-header">
      <h1>YABLU-MC</h1>
      <p>Weekly Task Planner</p>
      <div className="header-buttons">
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
          {/* You can add a count for completed tasks if needed */}
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
