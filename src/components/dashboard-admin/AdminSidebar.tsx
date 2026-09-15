import React from 'react';

export interface AdminNavItem {
  key: string;
  label: string;
  shortLabel?: string;
  icon: string;
  onClick: () => void;
  active: boolean;
  visible?: boolean;
}

interface AdminSidebarProps {
  items: AdminNavItem[];
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ items, isOpen, onClose }) => {
  return (
    <>
      <aside className={`admin-sidebar${isOpen ? ' is-open' : ''}`}>
        {/* <div className="admin-sidebar-brand">
          <img src="/assets/img/logo/logo-green.png" alt="Logo" />
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <i className="fas fa-times"></i>
          </button>
        </div> */}

        <ul className="admin-nav-list">
          {items
            .filter((item) => item.visible !== false)
            .map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={`admin-nav-item${item.active ? ' active' : ''}`}
                  onClick={() => {
                    item.onClick();
                    onClose();
                  }}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
        </ul>
      </aside>
      <div
        className={`admin-sidebar-backdrop${isOpen ? ' is-open' : ''}`}
        onClick={onClose}
      />
    </>
  );
};

export default AdminSidebar;
