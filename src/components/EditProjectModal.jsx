import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { PROJECT_COLORS } from '../utils/constants';
import { getProjectColorClass } from '../utils/helpers';


function EditProjectModal({ project, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setSelectedColor(project.color || PROJECT_COLORS[0].value);
    }
  }, [project]);

  if (!project) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(project.id, title.trim(), selectedColor);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Project</h2>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="projectTitleEditModal">Project Title</label>
            <input
              id="projectTitleEditModal"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="modal-input"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Project Color</label>
            <div className="color-picker">
              {PROJECT_COLORS.map(color => (
                <div
                  key={color.value}
                  className={`color-option ${getProjectColorClass(color.value)} ${selectedColor === color.value ? 'selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                >
                  {selectedColor === color.value && <Check size={16} />}
                </div>
              ))}
            </div>
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

export default EditProjectModal;
