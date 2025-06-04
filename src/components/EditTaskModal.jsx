import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function EditTaskModal({ task, projectDefinitions, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setSelectedProject(task.projectId || (projectDefinitions.length > 0 ? projectDefinitions[0].id : ''));
    }
  }, [task, projectDefinitions]);

  if (!task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      const project = projectDefinitions.find(p => p.id === selectedProject);
      onSave(task.id, {
        title: title.trim(),
        projectId: selectedProject,
        projectColor: project?.color || task.projectColor
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="taskTitleEdit">Task Title</label>
            <input
              id="taskTitleEdit"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="modal-input"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="taskProjectEdit">Project</label>
            <select
              id="taskProjectEdit"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="modal-select"
            >
              {projectDefinitions.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="modal-btn cancel">Cancel</button>
            <button type="submit" className="modal-btn save">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTaskModal;
