import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function AddTaskModal({ projectDefinitions, onSave, onCancel, initialProjectId }) {
  const [title, setTitle] = useState('');
  // Initialize selectedProject with initialProjectId if provided and valid,
  // otherwise, if projectDefinitions exist, default to the first one.
  const [selectedProject, setSelectedProject] = useState(() => {
    if (initialProjectId && projectDefinitions.some(p => p.id === initialProjectId)) {
      return initialProjectId;
    }
    return projectDefinitions.length > 0 ? projectDefinitions[0].id : '';
  });

  // Effect to update selectedProject if initialProjectId changes or if projectDefinitions load
  useEffect(() => {
    if (initialProjectId && projectDefinitions.some(p => p.id === initialProjectId)) {
      setSelectedProject(initialProjectId);
    } else if (projectDefinitions.length > 0 && !projectDefinitions.some(p => p.id === selectedProject)) {
      // If current selectedProject is no longer valid (e.g., projects reloaded and it's gone)
      // or if it was empty and now there are projects, set to the first available.
      setSelectedProject(projectDefinitions[0].id);
    } else if (projectDefinitions.length === 0) {
      setSelectedProject(''); // No projects available
    }
  }, [initialProjectId, projectDefinitions, selectedProject]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && selectedProject) {
      const project = projectDefinitions.find(p => p.id === selectedProject);
      if (project) {
        onSave(title.trim(), selectedProject, project.color);
      } else {
        console.error("Selected project not found for new task.");
        // Optionally, handle this error more gracefully in the UI
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Task</h2>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="newTaskTitleModal">Task Title</label>
            <input
              id="newTaskTitleModal"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="modal-input"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="newTaskProjectModal">Project</label>
            <select
              id="newTaskProjectModal"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="modal-select"
              required
              disabled={projectDefinitions.length === 0}
            >
              {projectDefinitions.length === 0 ? (
                <option value="">Please add a project first</option>
              ) : (
                projectDefinitions.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="modal-btn cancel">Cancel</button>
            <button type="submit" className="modal-btn save" disabled={projectDefinitions.length === 0 || !title.trim()}>Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;

