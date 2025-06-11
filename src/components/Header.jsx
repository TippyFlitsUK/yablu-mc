import React from 'react';
import { PlusCircle, CheckCircle, Trash, ListPlus, Download, Cloud } from 'lucide-react';

function AppHeader({
  onOpenAddProjectModal,
  onOpenAddTaskModal, // New prop
  onShowCompletedTasks,
  onShowRecycleBin,
  onExportData,
  onScanGoogleDrive,
  recycleBinCount
}) {
  return (
    <div className="app-header">
      <div className="header-service-buttons">
        <button
          className="gdrive-export-btn header-action-btn"
          onClick={onScanGoogleDrive}
          title="Export Google Drive Files"
        >
          <Cloud size={20} />
        </button>
      </div>
      <img src="/yablu.png" alt="Yablu" className="app-logo" />
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
        </button>
        <button
          className="export-data-btn header-action-btn"
          onClick={onExportData}
          title="Export Task Data"
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
}

export default AppHeader;

