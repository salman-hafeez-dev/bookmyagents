import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { serviceService } from '../../../services/serviceService';
import { type Service, type CreateServiceData, type ServiceFilters } from '../../../types/service';
import ServiceForm from '../../forms/ServiceForm';
import ServiceList from '../../common/ServiceList';
import AgentBlogManagement from '../admin/AgentBlogManagement';
import ActiveSubscriptionPanel from './ActiveSubscriptionPanel';
import AgentProfileSetup from './profile/AgentProfileSetup';
import AgentPaymentsPanel from './AgentPaymentsPanel';
import AgentPackagesPanel from './packages/AgentPackagesPanel';
import AgentLeadsPanel from './leads/AgentLeadsPanel';
import AgentReviewsPanel from './reviews/AgentReviewsPanel';
import AgentQuotesPanel from './quotes/AgentQuotesPanel';
import InnerHeader from '../../../layouts/headers/InnerHeader';
import AdminDashboardShell from '../../dashboard-admin/AdminDashboardShell';
import { type AdminNavItem } from '../../dashboard-admin/AdminSidebar';
import { useGetAgentServicesQuery, useGetServiceStatsQuery } from '../../../redux/api/dashboardApi';

type ActiveView = 'list' | 'create' | 'edit' | 'packages' | 'leads' | 'quotes' | 'reviews' | 'blogs' | 'subscription' | 'profile' | 'payments';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('packages');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [filters, setFilters] = useState<ServiceFilters>({
    page: 1,
    limit: 12,
    search: '',
    category: '',
  });

  const {
    data: servicesResponse,
    isFetching: isLoading,
    refetch: refetchServices,
  } = useGetAgentServicesQuery(filters, { skip: activeView !== 'list' || !user?._id });
  const services = servicesResponse?.data || [];

  const {
    data: stats = { totalServices: 0, servicesByCategory: {}, averagePrice: 0, totalRevenue: 0 },
    refetch: refetchStats,
  } = useGetServiceStatsQuery(user?._id, { skip: activeView !== 'list' || !user?._id });

  const handleCreateService = async (serviceData: CreateServiceData) => {
    try {
      setIsSubmitting(true);
      await serviceService.createService(serviceData);
      setActiveView('list');
      // When view changes to 'list', queries will auto-fetch due to skip condition
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateService = async (serviceData: CreateServiceData) => {
    if (!editingService?._id) return;

    try {
      setIsSubmitting(true);
      await serviceService.updateService({ _id: editingService._id, ...serviceData });
      setActiveView('list');
      setEditingService(null);
      // When view changes to 'list', queries will auto-fetch due to skip condition
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setActiveView('edit');
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await serviceService.deleteService(serviceId);
      // Manually refetch if queries are currently running
      try {
        activeView === 'list' && refetchServices?.();
        activeView === 'list' && refetchStats?.();
      } catch (e) {
        console.warn('Refetch not available:', e);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleCancelForm = () => {
    setActiveView('list');
    setEditingService(null);
  };

  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //   }
  // };

  const getCategoryStats = () => {
    return Object.entries(stats.servicesByCategory).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count,
    }));
  };

  const navItems: AdminNavItem[] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: 'fas fa-id-badge',
      onClick: () => setActiveView('profile'),
      active: activeView === 'profile',
    },
    {
      key: 'leads',
      label: 'Leads',
      icon: 'fas fa-inbox',
      onClick: () => setActiveView('leads'),
      active: activeView === 'leads',
    },
    {
      key: 'quotes',
      label: 'Quotations',
      icon: 'fas fa-file-invoice',
      onClick: () => setActiveView('quotes'),
      active: activeView === 'quotes',
    },
    {
      key: 'reviews',
      label: 'Reviews',
      icon: 'fas fa-star',
      onClick: () => setActiveView('reviews'),
      active: activeView === 'reviews',
    },
    {
      key: 'packages',
      label: 'My Packages',
      icon: 'fas fa-suitcase-rolling',
      onClick: () => setActiveView('packages'),
      active: activeView === 'packages',
    },
    // Services are superseded by Packages. Hidden rather than deleted: the
    // records and the /api/services endpoints are untouched, so this is a
    // one-line revert if an agent turns out to need them.
    {
      key: 'list',
      label: 'My Services',
      icon: 'fas fa-list',
      onClick: () => setActiveView('list'),
      active: activeView === 'list' || activeView === 'edit',
      visible: false,
    },
    {
      key: 'blogs',
      label: 'My Blogs',
      icon: 'fas fa-blog',
      onClick: () => setActiveView('blogs'),
      active: activeView === 'blogs',
    },
    {
      key: 'create',
      label: 'Create Service',
      icon: 'fas fa-plus',
      onClick: () => setActiveView('create'),
      active: activeView === 'create',
      visible: false,
    },
    {
      key: 'subscription',
      label: 'Active Subscription',
      icon: 'fas fa-id-card',
      onClick: () => setActiveView('subscription'),
      active: activeView === 'subscription',
    },
    {
      key: 'payments',
      label: 'Payments',
      icon: 'fas fa-receipt',
      onClick: () => setActiveView('payments'),
      active: activeView === 'payments',
    },
  ];

  return (
    <div className="admin-fixed-viewport">
      <InnerHeader />

      <AdminDashboardShell
        title={""}
        subtitle={""}
        navItems={navItems}
      >
        {/* Payment history — the agent's own payments only */}
        {activeView === 'payments' && <AgentPaymentsPanel />}

        {/* Agent Profile — company details, documents and approval status */}
        {activeView === 'profile' && <AgentProfileSetup />}

        {/* Packages — the offers customers actually search and compare */}
        {activeView === 'packages' && <AgentPackagesPanel />}

        {/* Leads — what the subscription actually delivers */}
        {activeView === 'leads' && <AgentLeadsPanel />}

        {/* Quotations — the priced answer to a quote request */}
        {activeView === 'quotes' && <AgentQuotesPanel />}

        {/* Reviews — read-only: a rating an agent can curate is not a rating */}
        {activeView === 'reviews' && <AgentReviewsPanel />}

        {/* Services List View */}
        {activeView === 'list' && (
          <>
            {/* Stats Cards */}
            <div className="row mb-40">
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 mb-30">
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="fas fa-box"></i>
                  </div>
                  <div className="stats-content">
                    <h3>{stats.totalServices}</h3>
                    <p>Total Services</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 mb-30">
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="fas fa-receipt"></i>
                  </div>
                  <div className="stats-content">
                    <h3>${stats.averagePrice.toFixed(0)}</h3>
                    <p>Average Price</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 mb-30">
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div className="stats-content">
                    <h3>${stats.totalRevenue.toFixed(0)}</h3>
                    <p>Total Revenue</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 mb-30">
                <div className="stats-card">
                  <div className="stats-icon">
                    <i className="fas fa-tags"></i>
                  </div>
                  <div className="stats-content">
                    <h3>{Object.keys(stats.servicesByCategory).length}</h3>
                    <p>Categories</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {getCategoryStats().length > 0 && (
              <div className="dashboard-card mb-40">
                <div className="card-header">
                  <h4>Services by Category</h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    {getCategoryStats().map(({ category, count }) => (
                      <div key={category} className="col-md-3 col-sm-6 mb-3">
                        <div className="category-stat">
                          <div className="category-name">{category}</div>
                          <div className="category-count">{count} services</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="dashboard-card mb-30">
              <div className="card-header">
                <h4>Filter Services</h4>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-lg-4 col-md-6 col-12">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search services..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                  <div className="col-lg-3 col-md-6 col-12">
                    <select
                      className="form-select"
                      value={filters.category || ''}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                      <option value="">All Categories</option>
                      <option value="accommodation">Accommodation</option>
                      <option value="transportation">Transportation</option>
                      <option value="tours">Tours</option>
                      <option value="food">Food & Dining</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="shopping">Shopping</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-lg-2 col-md-3 col-6">
                    <button
                      className="btn btn-primary w-100"
                      onClick={() => refetchServices()}
                    >
                      <i className="fas fa-search d-md-none me-1"></i>
                      <span className="d-none d-md-inline">Search</span>
                      <span className="d-md-none">Search</span>
                    </button>
                  </div>
                  <div className="col-lg-3 col-md-9 col-6">
                    <button
                      className="btn btn-success w-100"
                      onClick={() => setActiveView('create')}
                    >
                      <i className="fas fa-plus me-2"></i>
                      <span className="d-none d-lg-inline">Create New Service</span>
                      <span className="d-lg-none">Create Service</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Services List */}
            <div className="dashboard-card">
              <div className="card-header">
                <h4>My Services ({services.length})</h4>
              </div>
              <div className="card-body">
                <ServiceList
                  services={services}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </>
        )}

        {/* Create Service View */}
        {activeView === 'create' && (
          <div className="dashboard-card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4>Create New Service</h4>
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleCancelForm}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Services
                </button>
              </div>
            </div>
            <div className="card-body">
              <ServiceForm
                onSubmit={handleCreateService}
                onCancel={handleCancelForm}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Edit Service View */}
        {activeView === 'edit' && editingService && (
          <div className="dashboard-card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4>Edit Service</h4>
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleCancelForm}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Services
                </button>
              </div>
            </div>
            <div className="card-body">
              <ServiceForm
                service={editingService}
                onSubmit={handleUpdateService}
                onCancel={handleCancelForm}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Blog Management View */}
        {activeView === 'blogs' && (
          <AgentBlogManagement />
        )}

        {/* Active Subscription View */}
        {activeView === 'subscription' && (
          <ActiveSubscriptionPanel />
        )}
      </AdminDashboardShell>
    </div>
  );
};

export default AgentDashboard;
