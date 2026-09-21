import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCurrency } from '../../../hooks/useCurrency';
import { userService, type UserFilters } from '../../../services/userService';
import { type User } from '../../../services/authService';
import { subscriptionService, type Subscription } from '../../../services/subscriptionService';
import EditSubscriptionModal from './EditSubscriptionModal';
import UserSubscriptionModal from './UserSubscriptionModal';
import BlogManagement from '../admin/BlogManagement';
import AgentBlogManagement from '../admin/AgentBlogManagement';
import CategoryManagement from '../admin/CategoryManagement';
import AgentApprovalManagement from '../admin/AgentApprovalManagement';
import LeadsManagement from '../admin/LeadsManagement';
import ReviewsManagement from '../admin/ReviewsManagement';
import PaymentsManagement from '../admin/PaymentsManagement';
import PaymentAccountSettings from '../admin/PaymentAccountSettings';
import SiteSettingsManagement from '../admin/SiteSettingsManagement';
import LegalPagesManagement from '../admin/LegalPagesManagement';
import ConfirmationModal from '../../common/ConfirmationModal';
import AdminChangePasswordModal from '../../modals/AdminChangePasswordModal';
import { showToast } from '../../../utils/toast';
import { extractApiError } from '../../../services/agentProfileService';
import SubscriptionRequestsPanel from '../admin/SubscriptionRequestsPanel';
import AdminDashboardShell from '../../dashboard-admin/AdminDashboardShell';
import { type AdminNavItem } from '../../dashboard-admin/AdminSidebar';
import { Badge, DataTable, IconButton, type BadgeTone, type DataTableColumn } from '../../ui';
import { useGetUsersQuery, useGetSubscriptionsQuery } from '../../../redux/api/dashboardApi';

type ActiveModule = 'users' | 'subscriptions' | 'subscription-requests' | 'payments' | 'payment-account' | 'leads' | 'reviews' | 'agents' | 'categories' | 'blogs' | 'site-settings' | 'legal-pages';
type UserRoleFilter = 'all' | 'admin' | 'agent' | 'user';


interface UserStatsShape { totalUsers: number }

const ROLE_TABS: {
  key: UserRoleFilter;
  label: string;
  icon: string;
  count: (users: User[], stats: UserStatsShape) => number;
}[] = [
  { key: 'all',   label: 'All Users', icon: 'fas fa-users',       count: (_u, stats) => stats.totalUsers },
  { key: 'admin', label: 'Admins',    icon: 'fas fa-shield-alt',  count: (u) => u.filter((x) => x.role === 'admin').length },
  { key: 'agent', label: 'Agents',    icon: 'fas fa-user-tie',    count: (u) => u.filter((x) => x.role === 'agent').length },
  { key: 'user',  label: 'Users',     icon: 'fas fa-user',        count: (u) => u.filter((x) => x.role === 'user' || !x.role).length },
];

const ROLE_TONES: Record<string, BadgeTone> = {
  admin: 'danger',
  agent: 'warning',
  user: 'primary',
};

const DashboardArea: React.FC = () => {
  const currency = useCurrency();
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState<ActiveModule>(
    user?.role === 'admin' ? 'users' : 'blogs'
  );

  // User Module State
  const [userFilters, setUserFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: '',
    role: ''
  });
  // Debounce only the query args (not the input value) so the cached
  // RTK Query request doesn't fire on every keystroke.
  const [debouncedUserFilters, setDebouncedUserFilters] = useState<UserFilters>(userFilters);
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Destructive / status actions are confirmed before they run.
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUserSubscriptionModal, setShowUserSubscriptionModal] = useState(false);

  // Subscription Module State
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedUserFilters(userFilters);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [userFilters.search, userFilters.role]);

  const {
    data: usersResponse,
    isFetching: userLoading,
    refetch: refetchUsers,
  } = useGetUsersQuery(debouncedUserFilters, { skip: activeModule !== 'users' || user?.role !== 'admin' });
  const users = usersResponse?.data || [];
  const userStats = {
    totalUsers: usersResponse?.statistics?.totalUsers || 0,
    activeUsers: usersResponse?.statistics?.activeUsers || 0,
    newUsersThisMonth: usersResponse?.statistics?.newThisMonth || 0,
  };

  const {
    data: subscriptionsResponse,
    isFetching: subscriptionLoading,
    refetch: refetchSubscriptions,
  } = useGetSubscriptionsQuery(undefined, { skip: activeModule !== 'subscriptions' || user?.role !== 'admin' });
  const subscriptions = subscriptionsResponse?.data || [];

  // Confirmed via the modal rather than firing straight off the toggle, so a
  // mis-click can't take an agent offline.
  const handleUserStatusToggle = async () => {
    if (!statusTarget) return;
    const nextStatus = !statusTarget.isActive;
    setActionLoading(true);
    try {
      await userService.updateUser(statusTarget._id, { isActive: nextStatus });
      showToast.success(`${statusTarget.fullName} is now ${nextStatus ? 'active' : 'inactive'}.`);
      setStatusTarget(null);
      refetchUsers(); // Cached list is now stale — force a fresh fetch
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await userService.deleteUser(deleteTarget._id);
      showToast.success(`${deleteTarget.fullName} was deleted.`);
      setDeleteTarget(null);
      refetchUsers();
    } catch (error) {
      // The API refuses to delete admins, your own account, or anyone with
      // payment history — surface its reason rather than a generic failure.
      showToast.error(extractApiError(error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubscriptionUpdate = async (subscriptionData: Partial<Subscription>) => {
    if (!editingSubscription) return;

    try {
      await subscriptionService.updateSubscription({ _id: editingSubscription._id, ...subscriptionData });
      setShowEditModal(false);
      setEditingSubscription(null);
      refetchSubscriptions(); // Cached list is now stale — force a fresh fetch
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const handleRoleFilterChange = (role: UserRoleFilter) => {
    setRoleFilter(role);
    const newFilters = {
      ...userFilters,
      role: role === 'all' ? '' : role
    };
    setUserFilters(newFilters);
  };

  const handleAssignSubscription = (userItem: User) => {
    setSelectedUser(userItem);
    setShowUserSubscriptionModal(true);
  };

  const handleSubscriptionAssigned = () => {
    refetchUsers(); // Refresh users list
  };

  // Filter users by role for display
  const getFilteredUsers = () => {
    if (roleFilter === 'all') return users;
    const filteredUsers = users.filter(userItem => userItem.role === roleFilter);
    console.log("filteredUsers", filteredUsers);
    return filteredUsers;
  };


  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //   }
  // };

  const navItems: AdminNavItem[] = [
    {
      key: 'users',
      label: 'User Module',
      icon: 'fas fa-users',
      onClick: () => setActiveModule('users'),
      active: activeModule === 'users',
      visible: user?.role === 'admin',
    },
    {
      key: 'subscriptions',
      label: 'Subscription Plans',
      icon: 'fas fa-credit-card',
      onClick: () => setActiveModule('subscriptions'),
      active: activeModule === 'subscriptions',
      visible: user?.role === 'admin',
    },
    {
      key: 'subscription-requests',
      label: 'Subscription Requests',
      icon: 'fas fa-file-signature',
      onClick: () => setActiveModule('subscription-requests'),
      active: activeModule === 'subscription-requests',
      visible: user?.role === 'admin',
    },
    {
      key: 'payments',
      label: 'Payments',
      icon: 'fas fa-receipt',
      onClick: () => setActiveModule('payments'),
      active: activeModule === 'payments',
      visible: user?.role === 'admin',
    },
    {
      key: 'payment-account',
      label: 'Payment Account',
      icon: 'fas fa-university',
      onClick: () => setActiveModule('payment-account'),
      active: activeModule === 'payment-account',
      visible: user?.role === 'admin',
    },
    {
      key: 'leads',
      label: 'Lead Module',
      icon: 'fas fa-inbox',
      onClick: () => setActiveModule('leads'),
      active: activeModule === 'leads',
    },
    {
      key: 'reviews',
      label: 'Review Module',
      icon: 'fas fa-star',
      onClick: () => setActiveModule('reviews'),
      active: activeModule === 'reviews',
      visible: user?.role === 'admin',
    },
    {
      key: 'agents',
      label: 'Agent Approvals',
      icon: 'fas fa-user-check',
      onClick: () => setActiveModule('agents'),
      active: activeModule === 'agents',
      visible: user?.role === 'admin',
    },
    {
      key: 'categories',
      label: 'Category Module',
      icon: 'fas fa-folder-open',
      onClick: () => setActiveModule('categories'),
      active: activeModule === 'categories',
      visible: user?.role === 'admin',
    },
    {
      key: 'blogs',
      label: 'Blog Module',
      icon: 'fas fa-blog',
      onClick: () => setActiveModule('blogs'),
      active: activeModule === 'blogs',
    },
    {
      key: 'site-settings',
      label: 'Site & Contact',
      icon: 'fas fa-address-book',
      onClick: () => setActiveModule('site-settings'),
      active: activeModule === 'site-settings',
      visible: user?.role === 'admin',
    },
    {
      key: 'legal-pages',
      label: 'Legal Pages',
      icon: 'fas fa-file-contract',
      onClick: () => setActiveModule('legal-pages'),
      active: activeModule === 'legal-pages',
      visible: user?.role === 'admin',
    },
  ];

  const userColumns: DataTableColumn<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (userItem) => <span className="fw-semibold">{userItem.fullName}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (userItem) => <span className="text-muted">{userItem.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      nowrap: true,
      render: (userItem) => (
        <Badge tone={ROLE_TONES[userItem.role || 'user'] || 'neutral'}>
          {userItem.role || 'user'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      nowrap: true,
      render: (userItem) => (userItem.isActive
        ? <Badge tone="success" dot>Active</Badge>
        : <Badge tone="neutral" dot>Inactive</Badge>),
    },
    {
      key: 'subscription',
      header: 'Agent subscription',
      nowrap: true,
      hideBelow: 'lg',
      render: (userItem) => {
        if (userItem.role !== 'agent') return <span className="text-muted">—</span>;
        return userItem.subscription
          ? <Badge tone="info">{userItem.subscription.name}</Badge>
          : <Badge tone="warning">No subscription</Badge>;
      },
    },
    {
      key: 'created',
      header: 'Created',
      nowrap: true,
      hideBelow: 'md',
      render: (userItem) => (
        <span className="text-muted">
          {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '168px',
      render: (userItem) => (
        <div className="ui-actions">
          {userItem.role !== 'admin' && (
            <IconButton
              icon={userItem.isActive ? 'far fa-circle-pause' : 'far fa-circle-play'}
              label={userItem.isActive ? 'Deactivate user' : 'Activate user'}
              tone={userItem.isActive ? 'warning' : 'success'}
              onClick={() => setStatusTarget(userItem)}
            />
          )}
          {userItem.role === 'agent' && (
            <IconButton
              icon="far fa-credit-card"
              label="Manage subscription"
              onClick={() => handleAssignSubscription(userItem)}
            />
          )}
          {userItem._id !== user?._id && (
            <IconButton
              icon="far fa-key"
              label="Change password"
              onClick={() => setPasswordTarget(userItem)}
            />
          )}
          {/* Administrators are never deletable — the API enforces this too,
              so a crafted request can't get past a disabled button. */}
          <IconButton
            icon="far fa-trash-can"
            label={userItem.role === 'admin'
              ? 'System administrators cannot be deleted'
              : 'Delete user'}
            tone="danger"
            disabled={userItem.role === 'admin'}
            onClick={() => setDeleteTarget(userItem)}
          />
        </div>
      ),
    },
  ];

  const planColumns: DataTableColumn<Subscription>[] = [
    { key: 'name', header: 'Name', render: (plan) => <span className="fw-semibold">{plan.name}</span> },
    {
      key: 'price',
      header: 'Price',
      nowrap: true,
      // A plan carries no currency of its own, so it is shown in whatever the
      // admin has configured for the site.
      render: (plan) => currency.format(plan.price),
    },
    {
      key: 'categoryLimit',
      header: 'Category limit',
      align: 'center',
      hideBelow: 'md',
      render: (plan) => plan.categoryLimit ?? 1,
    },
    {
      key: 'features',
      header: 'Features',
      nowrap: true,
      hideBelow: 'lg',
      render: (plan) => `${plan.features.length} features`,
    },
    {
      key: 'popular',
      header: 'Popular',
      nowrap: true,
      render: (plan) => (plan.isPopular
        ? <Badge tone="warning" dot>Popular</Badge>
        : <Badge tone="neutral" dot>Standard</Badge>),
    },
    {
      key: 'created',
      header: 'Created',
      nowrap: true,
      hideBelow: 'lg',
      render: (plan) => (
        <span className="text-muted">
          {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '64px',
      render: (plan) => (
        <div className="ui-actions">
          <IconButton
            icon="far fa-pen-to-square"
            label="Edit plan"
            onClick={() => { setEditingSubscription(plan); setShowEditModal(true); }}
          />
        </div>
      ),
    },
  ];

  return (
    <AdminDashboardShell
      // title={`Welcome back, ${user?.fullName || 'User'}!`}
      // subtitle={
      //   user?.role === 'admin'
      //     ? 'Manage your users and subscriptions from here.'
      //     : 'Manage your blog posts and content from here.'
      // }
      title={''}
      subtitle={""}
      navItems={navItems}
    >
      {/* User Module - Admin Only */}
      {activeModule === 'users' && user?.role === 'admin' && (
        <>
          {/* User Stats Cards */}
          <div className="row mb-40">
            <div className="col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-30">
              <div className="stats-card">
                <div className="stats-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stats-content">
                  <h3>{userStats.totalUsers}</h3>
                  <p>Total Users</p>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-30">
              <div className="stats-card">
                <div className="stats-icon">
                  <i className="fas fa-user-check"></i>
                </div>
                <div className="stats-content">
                  <h3>{userStats.activeUsers}</h3>
                  <p>Active Users</p>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-30">
              <div className="stats-card">
                <div className="stats-icon">
                  <i className="fas fa-user-plus"></i>
                </div>
                <div className="stats-content">
                  <h3>{userStats.newUsersThisMonth}</h3>
                  <p>New This Month</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card mb-30">
            <div className="card-body">
              {/* Role stays a row of tabs rather than a dropdown: each carries
                  a count, which is the reason to look at this screen. */}
              <div className="role-filter-tabs mb-20">
                <div className="nav nav-pills justify-content-center">
                  {ROLE_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`nav-link ${roleFilter === tab.key ? 'active' : ''}`}
                      onClick={() => handleRoleFilterChange(tab.key)}
                    >
                      <i className={`${tab.icon} me-2`}></i>
                      {tab.label} ({tab.count(users, userStats)})
                    </button>
                  ))}
                </div>
              </div>

              <DataTable<User>
                columns={userColumns}
                rows={getFilteredUsers()}
                rowKey={(userItem) => userItem._id || userItem.id || userItem.email}
                title="User Management"
                loading={userLoading}
                search={{
                  placeholder: 'Search users…',
                  value: userFilters.search || '',
                  onChange: (value) => setUserFilters({ ...userFilters, search: value }),
                }}
                pagination={{ noun: 'users' }}
                emptyState={{
                  icon: 'fas fa-users',
                  title: 'No users found',
                  description: 'No users match the selected role filter.',
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Subscription Requests - Admin Only, separate page */}
      {activeModule === 'subscription-requests' && user?.role === 'admin' && (
        <SubscriptionRequestsPanel />
      )}

      {/* Subscription Plans - Admin Only */}
      {activeModule === 'subscriptions' && user?.role === 'admin' && (
        <>
          {/* Subscription Stats */}
          <div className="row mb-40">
            <div className="col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-30">
              <div className="stats-card">
                <div className="stats-icon">
                  <i className="fas fa-credit-card"></i>
                </div>
                <div className="stats-content">
                  <h3>{subscriptions.length}</h3>
                  <p>Total Plans</p>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-30">
              <div className="stats-card">
                <div className="stats-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="stats-content">
                  <h3>{subscriptions.filter(s => s.isPopular).length}</h3>
                  <p>Popular Plans</p>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-30">
              <div className="stats-card">
                <div className="stats-icon">
                  <i className="fas fa-receipt"></i>
                </div>
                <div className="stats-content">
                  <h3>${subscriptions.length > 0 ? (subscriptions.reduce((sum, s) => sum + s.price, 0) / subscriptions.length).toFixed(0) : 0}</h3>
                  <p>Avg Price</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-body">
              <DataTable<Subscription>
                columns={planColumns}
                rows={subscriptions}
                rowKey={(plan) => plan._id}
                title="Subscription Plans"
                loading={subscriptionLoading}
                search={{ placeholder: 'Search plans…', keys: ['name'] }}
                pagination={{ noun: 'plans' }}
                emptyState={{
                  icon: 'fas fa-credit-card',
                  title: 'No subscription plans',
                  description: 'Plans appear here once they are created.',
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Category Module - Admin Only */}
      {activeModule === 'payments' && user?.role === 'admin' && (
        <PaymentsManagement />
      )}

      {activeModule === 'payment-account' && user?.role === 'admin' && (
        <PaymentAccountSettings />
      )}

      {activeModule === 'site-settings' && user?.role === 'admin' && (
        <SiteSettingsManagement />
      )}

      {activeModule === 'legal-pages' && user?.role === 'admin' && (
        <LegalPagesManagement />
      )}

      {activeModule === 'leads' && user?.role === 'admin' && <LeadsManagement />}

      {activeModule === 'reviews' && user?.role === 'admin' && <ReviewsManagement />}

      {activeModule === 'agents' && user?.role === 'admin' && (
        <AgentApprovalManagement />
      )}

      {activeModule === 'categories' && user?.role === 'admin' && (
        <CategoryManagement />
      )}

      {/* Blog Module */}
      {activeModule === 'blogs' && (
        user?.role === 'admin' ? (
          <BlogManagement />
        ) : (
          <AgentBlogManagement />
        )
      )}

      {/* Edit Subscription Modal */}
      {showEditModal && editingSubscription && (
        <EditSubscriptionModal
          subscription={editingSubscription}
          onClose={() => {
            setShowEditModal(false);
            setEditingSubscription(null);
          }}
          onSave={handleSubscriptionUpdate}
        />
      )}

      {/* User Subscription Modal */}
      {showUserSubscriptionModal && selectedUser && (
        <UserSubscriptionModal
          user={selectedUser}
          isOpen={showUserSubscriptionModal}
          onClose={() => {
            setShowUserSubscriptionModal(false);
            setSelectedUser(null);
          }}
          onSubscriptionAssigned={handleSubscriptionAssigned}
        />
      )}
      {/* Status change — different wording and colour per direction */}
      <ConfirmationModal
        isOpen={!!statusTarget}
        title={statusTarget?.isActive ? 'Deactivate User' : 'Activate User'}
        subtitle={statusTarget?.fullName}
        heading={statusTarget?.isActive ? 'Account Will Be Inactive' : 'Account Will Be Active'}
        description={statusTarget?.isActive
          ? 'This account will no longer be visible to users. Existing bookings continue, but no new bookings can be made and users cannot make contact.'
          : 'This account will be visible to users again and able to receive new bookings.'}
        icon={statusTarget?.isActive ? 'warning' : 'success'}
        actionColor={statusTarget?.isActive ? 'danger' : 'success'}
        actionLabel={statusTarget?.isActive ? 'Deactivate' : 'Activate'}
        loading={actionLoading}
        onConfirm={handleUserStatusToggle}
        onCancel={() => setStatusTarget(null)}
      />

      {/* Deletion */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete User"
        subtitle={deleteTarget?.fullName}
        heading="Permanent Deletion"
        description="This account and its profile, subscription and plan requests will be permanently removed. Accounts with payment history cannot be deleted — deactivate those instead."
        icon="error"
        actionColor="danger"
        actionLabel="Delete User"
        dangerZone
        loading={actionLoading}
        onConfirm={handleUserDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Admin-initiated password change */}
      <AdminChangePasswordModal
        isOpen={!!passwordTarget}
        agent={passwordTarget}
        onSuccess={() => { setPasswordTarget(null); refetchUsers(); }}
        onClose={() => setPasswordTarget(null)}
      />
    </AdminDashboardShell>
  );
};

export default DashboardArea;
