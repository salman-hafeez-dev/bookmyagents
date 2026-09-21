import React, { useCallback, useEffect, useState } from 'react';
import { type Category } from '../../../../types/category';
import {
  type AgentPackageMeta,
  type PackageFilters,
  type TravelPackage,
} from '../../../../types/package';
import { packageService } from '../../../../services/packageService';
import { agentProfileService } from '../../../../services/agentProfileService';
import { showToast, getErrorMessage } from '../../../../utils/toast';
import { useConfirm } from '../../../../contexts/ConfirmContext';
import PackageForm from './PackageForm';
import { Select } from '../../../ui';
import PackageList from './PackageList';

type PanelView = 'list' | 'create' | 'edit';

// The whole package module for the agent dashboard: list, create, edit and the
// banner explaining whether packages are actually reaching customers.
const AgentPackagesPanel: React.FC = () => {
  const confirm = useConfirm();

  const [view, setView] = useState<PanelView>('list');
  const [editing, setEditing] = useState<TravelPackage | undefined>();

  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [meta, setMeta] = useState<AgentPackageMeta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PackageFilters>({ page: 1, limit: 12 });

  const loadPackages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await packageService.getMyPackages(filters);
      setPackages(response.data);
      setMeta(response.meta);
    } catch (error) {
      showToast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // The agent's categories come from their profile, where they are already
  // capped by the subscription's categoryLimit — so the form offers exactly
  // the categories the API will accept.
  const loadCategories = useCallback(async () => {
    try {
      const response = await agentProfileService.getStatus();
      setCategories(response.data?.categories || []);
    } catch (error) {
      console.error('Failed to load agent categories:', error);
    }
  }, []);

  useEffect(() => { loadPackages(); }, [loadPackages]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const handleSaved = () => {
    setView('list');
    setEditing(undefined);
    loadPackages();
  };

  const handleDelete = async (travelPackage: TravelPackage) => {
    const confirmed = await confirm({
      title: 'Delete package',
      description: `"${travelPackage.title}" and its photos will be permanently removed. This cannot be undone.`,
      icon: 'warning',
      actionLabel: 'Delete',
      actionColor: 'danger',
      dangerZone: true,
    });
    if (!confirmed) return;

    try {
      await packageService.deletePackage(travelPackage._id);
      showToast.success('Package deleted');
      loadPackages();
    } catch (error) {
      showToast.error(getErrorMessage(error));
    }
  };

  const handleToggleActive = async (travelPackage: TravelPackage) => {
    try {
      await packageService.setPackageActive(travelPackage._id, !travelPackage.isActive);
      showToast.success(travelPackage.isActive ? 'Package hidden' : 'Package is now live');
      loadPackages();
    } catch (error) {
      showToast.error(getErrorMessage(error));
    }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <PackageForm
        categories={categories}
        travelPackage={view === 'edit' ? editing : undefined}
        onSaved={handleSaved}
        onCancel={() => { setView('list'); setEditing(undefined); }}
      />
    );
  }

  return (
    <>
      {/* Why a package may not be reaching customers yet. Packages can be
          created while approval is pending so the agent is ready to go live
          the moment an admin approves them. */}
      {meta && !meta.isPubliclyVisible && (
        <div className="alert alert-warning d-flex align-items-start gap-2 mb-4">
          <i className="fas fa-triangle-exclamation mt-1"></i>
          <div>
            <strong>Your packages are not visible to customers yet.</strong>
            <div className="small">
              {meta.profileStatus === 'pending'
                ? 'Your profile is with our team for review. Once it is approved, every live package appears in search straight away.'
                : 'Complete your profile and submit it for verification. Approved agents appear in customer search results.'}
            </div>
          </div>
        </div>
      )}

      <div className="row mb-4 g-3">
        <div className="col-xl-3 col-lg-6 col-md-6 col-12">
          <div className="stats-card">
            <div className="stats-icon"><i className="fas fa-suitcase-rolling"></i></div>
            <div className="stats-content">
              <h3>{meta?.totalPackages ?? 0}</h3>
              <p>Total Packages</p>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6 col-12">
          <div className="stats-card">
            <div className="stats-icon"><i className="fas fa-eye"></i></div>
            <div className="stats-content">
              <h3>{meta?.activePackages ?? 0}</h3>
              <p>Live Packages</p>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6 col-12">
          <div className="stats-card">
            <div className="stats-icon"><i className="fas fa-tags"></i></div>
            <div className="stats-content">
              <h3>{categories.length}</h3>
              <p>My Categories</p>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6 col-12">
          <div className="stats-card">
            <div className="stats-icon"><i className="fas fa-layer-group"></i></div>
            <div className="stats-content">
              <h3>{meta?.maxPackages ?? 0}</h3>
              <p>Package Limit</p>
            </div>
          </div>
        </div>
      </div>

      <PackageList
        packages={packages}
        isLoading={isLoading}
        onCreate={() => setView('create')}
        toolbar={(
          <>
            <Select
              options={[
                { value: '', label: 'All categories' },
                ...categories.map((category) => ({ value: category._id, label: category.name })),
              ]}
              value={filters.category || ''}
              size="sm"
              aria-label="Filter by category"
              onChange={(event) => setFilters({ ...filters, category: event.target.value || undefined, page: 1 })}
            />
            <Select
              options={[
                { value: '', label: 'Live and hidden' },
                { value: 'true', label: 'Live only' },
                { value: 'false', label: 'Hidden only' },
              ]}
              value={filters.isActive === undefined ? '' : String(filters.isActive)}
              size="sm"
              aria-label="Filter by visibility"
              onChange={(event) => setFilters({
                ...filters,
                isActive: event.target.value === '' ? undefined : event.target.value === 'true',
                page: 1,
              })}
            />
          </>
        )}
        onEdit={(travelPackage) => { setEditing(travelPackage); setView('edit'); }}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />
    </>
  );
};

export default AgentPackagesPanel;
