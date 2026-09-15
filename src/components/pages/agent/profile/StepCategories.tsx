import React, { useEffect, useMemo, useState } from 'react';
import { categoryService } from '../../../../services/categoryService';
import { profileService } from '../../../../services/profileService';
import { extractApiError } from '../../../../services/agentProfileService';
import { showToast } from '../../../../utils/toast';
import { type Category } from '../../../../types/category';
import { type AgentProfile } from '../../../../types/agentProfile';

interface StepCategoriesProps {
  profile: AgentProfile;
  locked: boolean;
  onSaved: () => Promise<void> | void;
  onBack: () => void;
  onNext: () => void;
}

// Categories are stored on the user account (User.categories), not on the
// agent profile — the same list the agent picked at signup, capped by their
// subscription's categoryLimit. This step edits that list and the profile's
// completion flag follows from it.
const StepCategories: React.FC<StepCategoriesProps> = ({ profile, locked, onSaved, onBack, onNext }) => {
  const [available, setAvailable] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>(profile.categories.map((category) => category._id));
  const [categoryLimit, setCategoryLimit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [categoriesResponse, profileResponse] = await Promise.all([
          categoryService.getCategories({ limit: 100 }),
          profileService.getProfile(),
        ]);
        if (cancelled) return;
        setAvailable(categoriesResponse.data || []);
        setCategoryLimit(profileResponse.data?.categoryLimit ?? null);
      } catch (error) {
        if (!cancelled) showToast.error(extractApiError(error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const atLimit = useMemo(
    () => categoryLimit !== null && selected.length >= categoryLimit,
    [categoryLimit, selected.length]
  );

  const toggle = (categoryId: string) => {
    setSelected((previous) => {
      if (previous.includes(categoryId)) {
        return previous.filter((id) => id !== categoryId);
      }
      if (categoryLimit !== null && previous.length >= categoryLimit) {
        showToast.info(
          `Your subscription allows up to ${categoryLimit} categor${categoryLimit === 1 ? 'y' : 'ies'}. Upgrade to select more.`
        );
        return previous;
      }
      return [...previous, categoryId];
    });
  };

  const save = async (advance: boolean) => {
    if (selected.length === 0) {
      showToast.error('Select at least one service category');
      return;
    }
    setSaving(true);
    try {
      await profileService.updateProfile({ categories: selected });
      // The completion flag is derived server-side from the saved categories,
      // so refetch rather than guessing the new percentage here.
      await onSaved();
      showToast.success('Service categories saved');
      if (advance) onNext();
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h4>Step 3 — Service categories</h4>
      </div>
      <div className="card-body">
        <p className="text-muted">
          Choose the services you offer. Travellers browse by category, so this decides where you appear.
          {categoryLimit !== null && (
            <> Your plan allows <strong>{categoryLimit}</strong> categor{categoryLimit === 1 ? 'y' : 'ies'}
              {' '}({selected.length} selected).</>
          )}
        </p>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading categories…</span>
            </div>
          </div>
        ) : available.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-folder-open" aria-hidden="true"></i>
            <h5 className="mt-3 mb-2">No categories available</h5>
            <p className="text-muted">An admin needs to create service categories first.</p>
          </div>
        ) : (
          <div className="row">
            {available.map((category) => {
              const isSelected = selected.includes(category._id);
              const isDisabled = locked || saving || (!isSelected && atLimit);
              return (
                <div className="col-md-6 col-lg-4 mb-20" key={category._id}>
                  <label
                    className={`d-flex gap-2 p-3 h-100 border rounded ${isSelected ? 'border-primary' : ''}`}
                    style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1 }}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input flex-shrink-0 mt-1"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => toggle(category._id)}
                    />
                    <span>
                      <span className="d-block fw-semibold">{category.name}</span>
                      <small className="text-muted d-block">{category.description}</small>
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        )}

        <div className="d-flex justify-content-between gap-2 mt-3">
          <button type="button" className="btn btn-outline-secondary" onClick={onBack} disabled={saving}>
            Back
          </button>
          <div className="d-flex gap-2">
            <button
              type="button" className="btn btn-outline-secondary"
              onClick={() => save(false)} disabled={locked || saving || loading}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button" className="btn btn-primary"
              onClick={() => save(true)} disabled={locked || saving || loading}
            >
              {saving ? 'Saving…' : 'Save & continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepCategories;
