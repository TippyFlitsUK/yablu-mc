import React from 'react';
import { X, RotateCcw, CheckCircle } from 'lucide-react';
import { formatDate, getTimeAgo, getProjectTitleFromDefinitions, getProjectColorClass } from '../utils/helpers';

function CompletedTasksModal({ completedTasks, projectDefinitions, onMarkIncomplete, onClose }) {
  const sortedTasks = [...completedTasks].sort((a, b) => b.completedAt - a.completedAt);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content completed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Completed Tasks</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body"> {/* Changed from completed-content to modal-body for consistency */}
          {sortedTasks.length === 0 ? (
            <div className="empty-completed">
              <CheckCircle size={48} />
              <p>No completed tasks yet</p>
              <span>Complete some tasks to see them here!</span>
            </div>
          ) : (
            <>
              <div className="completed-stats">
                <div className="stat-item">
                  <span className="stat-number">{sortedTasks.length}</span>
                  <span className="stat-label">Total Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {sortedTasks.filter(ct => ct.completedAt > Date.now() - 24 * 60 * 60 * 1000).length}
                  </span>
                  <span className="stat-label">Last 24 Hours</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {sortedTasks.filter(ct => ct.completedAt > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
                  </span>
                  <span className="stat-label">This Week</span>
                </div>
              </div>
              <div className="completed-tasks-list">
                {sortedTasks.map((completedTask) => {
                  const projectDef = projectDefinitions.find(p => p.id === completedTask.task.projectId);
                  const currentProjectColor = projectDef ? projectDef.color : completedTask.task.projectColor;
                  return (
                    <div
                      key={completedTask.task.id}
                      className={`completed-task-item ${getProjectColorClass(currentProjectColor)}`}
                    >
                      <div className="completed-task-info">
                        <div className="completed-task-title">
                          <CheckCircle size={16} className="completed-icon" />
                          <span className="project-name">[{getProjectTitleFromDefinitions(completedTask.task.projectId, projectDefinitions)}]</span>
                          <span className="task-text">{completedTask.task.title}</span>
                        </div>
                        <div className="completed-task-meta">
                          Completed {formatDate(completedTask.completedAt)} • {getTimeAgo(completedTask.completedAt)}
                        </div>
                      </div>
                      <div className="completed-task-actions">
                        <button
                          className="incomplete-btn"
                          onClick={() => onMarkIncomplete(completedTask)}
                          title="Mark as incomplete"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompletedTasksModal;
