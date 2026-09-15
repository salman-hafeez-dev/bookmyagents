import React, { useState, useEffect, type ReactNode } from 'react';
import AdminSidebar, { type AdminNavItem } from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../../styles/admin-glass.css';

interface AdminDashboardShellProps {
  title: string;
  subtitle?: string;
  navItems: AdminNavItem[];
  headerActions?: ReactNode;
  children: ReactNode;
}

const AdminDashboardShell: React.FC<AdminDashboardShellProps> = ({
  title,
  subtitle,
  navItems,
  headerActions,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Belt-and-suspenders: the .admin-fixed-viewport wrapper already
    // contains scrolling to .admin-content via flex layout, but this
    // guarantees no page/body scrollbar can appear regardless of any
    // ancestor margins, restored on unmount so other pages are unaffected.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="admin-shell">
      <div className="admin-shell-bg" aria-hidden="true"></div>
      <div className="admin-shell-inner">
        <div className="admin-shell-frame">
          <AdminSidebar
            items={navItems}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* <div className="admin-main"> */}
          <AdminHeader
            title={title}
            subtitle={subtitle}
            actions={headerActions}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <div className="admin-content">{children}</div>
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardShell;
