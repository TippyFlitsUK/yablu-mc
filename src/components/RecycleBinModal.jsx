import React from 'react';
import { X, RotateCcw, Trash as TrashIcon } from 'lucide-react'; // Renamed Trash to TrashIcon to avoid conflict
import { formatDate } from '../utils/helpers';

function RecycleBinModal({ deletedTasks, onRestore, onPermanentDelete, onClose }) {
  const getDaysRemaining = (deletedAt) => {
    const daysSinceDeleted = Math.floor((Date.now() - deletedAt) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysSinceDeleted);
  };
  const sortedTasks = [...deletedTasks].sort((a,b) => b.deletedAt - a.deletedAt);


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content recycle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Recycle Bin</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body"> {/* Changed from recycle-content to modal-body for consistency */}
          {sortedTasks.length === 0 ? (
            <div className="empty-recycle">
              <TrashIcon size={48} />
              <p>Recycle bin is empty</p>
            </div>
          ) : (
            <div className="deleted-tasks-list">
              {sortedTasks.map((deletedTask) => (
                <div key={deletedTask.task.id} className="deleted-task-item">
                  <div className="deleted-task-info">
                    <div className="deleted-task-title">{deletedTask.task.title}</div>
                    <div className="deleted-task-meta">
                      Deleted {formatDate(deletedTask.deletedAt)} • {getDaysRemaining(deletedTask.deletedAt)} days remaining
                    </div>
                  </div>
                  <div className="deleted-task-actions">
                    <button
                      className="restore-btn"
                      onClick={() => onRestore(deletedTask)}
                      title="Restore task"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      className="permanent-delete-btn"
                      onClick={() => onPermanentDelete(deletedTask.task.id)}
                      title="Delete permanently"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecycleBinModal;
