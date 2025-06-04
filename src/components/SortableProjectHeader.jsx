import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProjectHeader from './ProjectHeader'; // Assuming ProjectHeader only displays UI

// This component wraps ProjectHeader to make it sortable.
function SortableProjectHeader({ project, onContextMenu, columnId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.id, // Project ID is the sortable ID
    data: {
      type: 'project', // Distinguish from tasks
      project: project,
      originalColumnId: columnId, // Should always be 'master' for projects
    },
    disabled: columnId !== 'master', // Projects are only sortable in the master column
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    cursor: columnId === 'master' ? 'grab' : 'default', // Only grab cursor if sortable
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.3)' : undefined,
    zIndex: isDragging ? 200 : 'auto', // Higher z-index when dragging
    marginBottom: '8px', // Consistent margin
  };

  if (!project) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      // Only apply listeners if in master column, otherwise project is not draggable
      {...(columnId === 'master' ? listeners : {})}
      onContextMenu={(e) => {
        // Allow context menu regardless of sortability, if handler is provided
        if (onContextMenu) {
          onContextMenu(e, project);
        }
      }}
    >
      <ProjectHeader project={project} />
    </div>
  );
}

export default SortableProjectHeader;

