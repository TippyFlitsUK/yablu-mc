import React from 'react';

function AppContextMenu({ menuData, actions, onClose }) {
  if (!menuData || !menuData.visible) return null;

  return (
    <div
      className="context-menu"
      style={{ top: menuData.y, left: menuData.x }}
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside menu
    >
      {actions.map(action => (
        <button
          key={action.label}
          onClick={() => {
            action.handler(menuData.item);
            onClose();
          }}
          className={`context-menu-btn ${action.className || ''}`}
          disabled={action.disabled}
        >
          {action.icon} {action.label}
        </button>
      ))}
    </div>
  );
}

export default AppContextMenu;
