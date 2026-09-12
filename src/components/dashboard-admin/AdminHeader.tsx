import React, { type ReactNode } from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onMenuClick: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title, subtitle, actions, onMenuClick }) => {
  return (
    <div className="admin-header">
      <button
        type="button"
        className="admin-header-menu-btn"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <i className="fas fa-bars"></i>
      </button>

      {title && <div className="admin-header-titles">
        <h2 className="admin-header-title">{title}</h2>
        {subtitle && <p className="admin-header-subtitle">{subtitle}</p>}
      </div>}

      {actions && <div className="admin-header-actions">{actions}</div>}
    </div>
  );
};

export default AdminHeader;
