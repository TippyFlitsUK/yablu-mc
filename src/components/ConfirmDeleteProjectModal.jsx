import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

function ConfirmDeleteProjectModal({ project, hasOutstandingTasks, onConfirmDeleteEmpty, onCancel }) {
  if (!project) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete Project: {project.title}</h2>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <AlertTriangle size={48} className="warning-icon" />
          {hasOutstandingTasks ? (
            <p>This project cannot be deleted because it has outstanding tasks. Please complete, delete, or reassign all associated tasks before deleting the project.</p>
          ) : (
            <p>Are you sure you want to delete this project? This action cannot be undone.</p>
          )}
        </div>
        <div className="modal-actions">
          {hasOutstandingTasks ? (
            <button type="button" onClick={onCancel} className="modal-btn ok-btn">OK</button>
          ) : (
            <>
              <button type="button" onClick={onCancel} className="modal-btn cancel">Cancel</button>
              <button type="button" onClick={() => onConfirmDeleteEmpty(project)} className="modal-btn delete">Delete Project</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteProjectModal;
