import React from 'react';
import { getProjectColorClass } from '../utils/helpers';

function ProjectHeader({ project, onContextMenu }) {
  return (
    <div
      className={`project-header ${getProjectColorClass(project.color)}`}
      onContextMenu={onContextMenu} 
    >
      <div className="project-title-container">
        <div className="project-title">{project.title}</div>
      </div>
    </div>
  );
}

export default ProjectHeader;
