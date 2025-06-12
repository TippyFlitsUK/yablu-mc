import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
// Import from react-quill-new
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css'; // Assuming CSS path is similar

// Toolbar configuration for ReactQuill - Simplified set
const quillModules = {
  toolbar: [
    [{ 'font': [] }], // Font family
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }], // Header dropdown
    // [{ 'size': ['small', false, 'large', 'huge'] }], // REMOVED Text size

    ['bold', 'italic', 'underline', 'strike'],        // Toggled buttons
    ['blockquote', 'code-block'],                     // Blocks

    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    // [{ 'script': 'sub'}, { 'script': 'super' }],   // REMOVED Subscript/superscript
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // Outdent/indent
    // [{ 'direction': 'rtl' }],                      // REMOVED Text direction

    [{ 'color': [] }, { 'background': [] }],          // Dropdown with defaults from theme
    [{ 'align': [] }],                                // Text alignment

    ['link', /*'image', 'video'*/],                   // Embeds (image/video require custom handlers)

    ['clean']                                         // Remove formatting button
  ],
};

const quillFormats = [
  'font', 'header', /*'size',*/ // REMOVED size
  'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
  'list', 'bullet', /*'script',*/ 'indent', /*'direction',*/ // REMOVED script, direction
  'color', 'background', 'align',
  'link', /*'image', 'video'*/ 
];

function TaskDetailsModal({ task, projectDefinitions, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [notes, setNotes] = useState(''); 

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setSelectedProject(task.projectId || (projectDefinitions.length > 0 ? projectDefinitions[0].id : ''));
      setNotes(task.notes || ''); 
    } else {
      setTitle('');
      setSelectedProject(projectDefinitions.length > 0 ? projectDefinitions[0].id : '');
      setNotes('');
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
        projectColor: project?.color || task.projectColor,
        notes: notes, 
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content task-details-modal">
        <div className="modal-header">
          <h2>Task Details</h2>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="taskTitleDetails">Task Title</label>
            <input
              id="taskTitleDetails"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="modal-input"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="taskProjectDetails">Project</label>
            <select
              id="taskProjectDetails"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="modal-select"
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
          <div className="form-group notes-form-group"> 
            <label htmlFor="taskNotesDetails">Notes</label>
            <ReactQuill 
              key={task.id} 
              theme="snow" 
              value={notes} 
              onChange={setNotes}
              modules={quillModules}
              formats={quillFormats}
              className="modal-notes-editor-quill" 
              placeholder="Add your notes here..."
            />
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

export default TaskDetailsModal;

