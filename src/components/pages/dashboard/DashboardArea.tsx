import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { userService, type UserFilters } from '../../../services/userService';
import { type User } from '../../../services/authService';
import { subscriptionService, type Subscription } from '../../../services/subscriptionService';
import EditSubscriptionModal from './EditSubscriptionModal';
import UserSubscriptionModal from './UserSubscriptionModal';
import BlogManagement from '../admin/BlogManagement';
import AgentBlogManagement from '../admin/AgentBlogManagement';
import CategoryManagement from '../admin/CategoryManagement';
import AgentApprovalManagement from '../admin/AgentApprovalManagement';
import PaymentsManagement from '../admin/PaymentsManagement';
import PaymentAccountSettings from '../admin/PaymentAccountSettings';
import ConfirmationModal from '../../common/ConfirmationModal';
import AdminChangePasswordModal from '../../modals/AdminChangePasswordModal';
import { showToast } from '../../../utils/toast';
import { extractApiError } from '../../../services/agentProfileService';
import SubscriptionRequestsPanel from '../admin/SubscriptionRequestsPanel';
import AdminDashboardShell from '../../dashboard-admin/AdminDashboardShell';
import { type AdminNavItem } from '../../dashboard-admin/AdminSidebar';
import { TableSkeleton } from '../../dashboard-admin/Skeleton';
import { useGetUsersQuery, useGetSubscriptionsQuery } from '../../../redux/api/dashboardApi';

type ActiveModule = 'users' | 'subscriptions' | 'subscription-requests' | 'payments' | 'payment-account' | 'agents' | 'categories' | 'blogs';
type UserRoleFilter = 'all' | 'admin' | 'agent' | 'user';

const DashboardArea: React.FC = () => {
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

          {/* Role Filter Tabs */}
          <div className="dashboard-card mb-30">
            <div className="card-header">
              <div className='d-flex justify-content-between align-items-center'>
                <h4>User Management</h4>
                <div className="">
                  <div className="">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search users..."
                      value={userFilters.search}
                      onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body">

              {/* Role Filter Tabs */}
              <div className="role-filter-tabs">
                <div className="nav nav-pills justify-content-center">
                  <button
                    className={`nav-link ${roleFilter === 'all' ? 'active' : ''}`}
                    onClick={() => handleRoleFilterChange('all')}
                  >
                    <i className="fas fa-users me-2"></i>
                    All Users ({userStats.totalUsers})
                  </button>
                  <button
                    className={`nav-link ${roleFilter === 'admin' ? 'active' : ''}`}
                    onClick={() => handleRoleFilterChange('admin')}
                  >
                    <i className="fas fa-shield-alt me-2 role-icon-admin"></i>
                    Admins ({users.filter(u => u.role === 'admin').length})
                  </button>
                  <button
                    className={`nav-link ${roleFilter === 'agent' ? 'active' : ''}`}
                    onClick={() => handleRoleFilterChange('agent')}
                  >
                    <i className="fas fa-user-tie me-2 role-icon-agent"></i>
                    Agents ({users.filter(u => u.role === 'agent').length})
                    {/* <small className="d-block text-muted">With Subscriptions</small> */}
                  </button>
                  <button
                    className={`nav-link ${roleFilter === 'user' ? 'active' : ''}`}
                    onClick={() => handleRoleFilterChange('user')}
                  >
                    <i className="fas fa-user me-2 role-icon-user"></i>
                    Users ({users.filter(u => u.role === 'user' || !u.role).length})
                  </button>
                </div>
              </div>

              <div className='my-2'>
                {userLoading ? (
                  <TableSkeleton rows={6} columns={7} />
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Agent Subscription</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(getFilteredUsers()) && getFilteredUsers().map((userItem) => (
                          <tr key={userItem.id}>
                            <td>{userItem.fullName}</td>
                            <td>{userItem.email}</td>
                            <td>
                              <span className={`badge ${userItem.role === 'admin' ? 'bg-danger' :
                                userItem.role === 'agent' ? 'bg-warning' : 'bg-primary'
                                }`}>
                                {userItem.role || 'user'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${userItem.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                {userItem.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              {userItem.role === 'agent' ? (
                                userItem.subscription ? (
                                  <div className="subscription-info">
                                    <span className="badge bg-info">
                                      <i className="fas fa-check-circle me-1"></i>
                                      {userItem.subscription.name}
                                    </span>
                                    {/* <div className="subscription-price">
                                          <i className="fas fa-dollar-sign me-1"></i>
                                          {userItem.subscription.price}/{userItem.subscription.duration}
                                        </div> */}
                                  </div>
                                ) : (
                                  <span className="badge bg-warning">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    No Subscription
                                  </span>
                                )
                              ) : (
                                <span className="text-muted">
                                  <i className="fas fa-minus me-1"></i>
                                  N/A
                                </span>
                              )}
                            </td>
                            <td>{userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td>
                              <div className="btn-group" role="group">
                                {userItem.role !== 'admin' && <button
                                  className={`btn btn-sm ${userItem.isActive ? 'btn-warning' : 'btn-success'}`}
                                  onClick={() => setStatusTarget(userItem)}
                                  title={userItem.isActive ? 'Deactivate User' : 'Activate User'}
                                >
                                  <i className={`fas ${userItem.isActive ? 'fa-user-times' : 'fa-user-plus'}`}></i>
                                </button>}
                                {userItem.role === 'agent' && (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleAssignSubscription(userItem)}
                                    title="Manage Subscription"
                                  >
                                    <i className="fas fa-cog"></i>
                                  </button>
                                )}
                                {userItem._id !== user?._id && (
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => setPasswordTarget(userItem)}
                                    title="Change Password"
                                  >
                                    <i className="fas fa-key"></i>
                                  </button>
                                )}
                                {/* Administrators are never deletable — the API
                                    enforces this too, so a crafted request
                                    can't get past a disabled button. */}
                                <button
                                  className="btn btn-sm btn-danger"
                                  disabled={userItem.role === 'admin'}
                                  onClick={() => setDeleteTarget(userItem)}
                                  title={
                                    userItem.role === 'admin'
                                      ? 'System administrators cannot be deleted'
                                      : 'Delete User'
                                  }
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {getFilteredUsers().length === 0 && (
                      <div className="empty-state">
                        <i className="fas fa-users"></i>
                        <h5 className="mt-3 mb-2">No Users Found</h5>
                        <p className="text-muted">No users found for the selected role filter.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <div className="stats-content">
                  <h3>${subscriptions.length > 0 ? (subscriptions.reduce((sum, s) => sum + s.price, 0) / subscriptions.length).toFixed(0) : 0}</h3>
                  <p>Avg Price</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="dashboard-card">
            <div className="card-header">
              <h4>Subscription Plans</h4>
            </div>
            <div className="card-body">
              {subscriptionLoading ? (
                <TableSkeleton rows={4} columns={7} />
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Category Limit</th>
                        <th>Features</th>
                        <th>Popular</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(subscriptions) && subscriptions.map((subscription) => (
                        <tr key={subscription._id}>
                          <td>{subscription.name}</td>
                          <td>${subscription.price}</td>
                          <td>{subscription.categoryLimit ?? 1}</td>
                          <td>{subscription.features.length} features</td>
                          <td>
                            <span className={`badge ${subscription.isPopular ? 'bg-warning' : 'bg-secondary'}`}>
                              {subscription.isPopular ? 'Popular' : 'Standard'}
                            </span>
                          </td>
                          <td>{subscription.createdAt ? new Date(subscription.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setEditingSubscription(subscription);
                                setShowEditModal(true);
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
