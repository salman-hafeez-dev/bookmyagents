import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { TableSkeleton } from '../../dashboard-admin/Skeleton';
import LegalPageFormModal from './LegalPageFormModal';
import { legalPageService } from '../../../services/legalPageService';
import { extractApiError } from '../../../services/agentProfileService';
import { showToast } from '../../../utils/toast';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { siteApi } from '../../../redux/api/siteApi';
import { type LegalPage, type LegalPageSummary } from '../../../types/legalPage';

/**
 * Terms, privacy, and every other legal document, in one list.
 *
 * Generic on purpose: adding a refund or cookie policy is "New page" here,
 * not a code change — the public site serves any published slug at
 * /legal/:slug and links it from the footer automatically.
 */
const LegalPagesManagement: React.FC = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const [pages, setPages] = useState<LegalPageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LegalPage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await legalPageService.listAdmin({ limit: 100 });
      setPages(response.data || []);
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  // Anything that changes what the public site serves drops the cached copy,
  // so the footer's link list and the page bodies refetch on next use.
  const invalidatePublicCache = useCallback(() => {
    dispatch(siteApi.util.invalidateTags([{ type: 'LegalPages', id: 'LIST' }]));
  }, [dispatch]);

  const openCreate = () => { setEditing(null); setShowForm(true); };

  const openEdit = async (summary: LegalPageSummary) => {
    setBusyId(summary._id);
    try {
      // The list endpoint omits the body to stay small — fetch the full
      // document before opening the editor.
      const response = await legalPageService.getAdmin(summary._id);
      setEditing(response.data);
      setShowForm(true);
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setBusyId(null);
    }
  };

  const togglePublish = async (page: LegalPageSummary) => {
    const publishing = page.status !== 'published';
    if (!publishing) {
      const ok = await confirm({
        title: 'Unpublish page',
        subtitle: page.title,
        heading: 'Take This Page Off The Website',
        description: 'Visitors will no longer be able to read it, and its footer link disappears. The content is kept as a draft, so you can publish it again at any time.',
        icon: 'warning',
        actionColor: 'danger',
        actionLabel: 'Unpublish',
      });
      if (!ok) return;
    }

    setBusyId(page._id);
    try {
      await legalPageService.update(page._id, { status: publishing ? 'published' : 'draft' });
      invalidatePublicCache();
      dispatch(siteApi.util.invalidateTags([{ type: 'LegalPages', id: page.slug }]));
      showToast.success(publishing ? `${page.title} is now live` : `${page.title} is back to draft`);
      fetchPages();
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (page: LegalPageSummary) => {
    const ok = await confirm({
      title: 'Delete legal page',
      subtitle: page.title,
      heading: 'Delete This Page Permanently',
      description: 'The page and its content are removed for good, and any link to it stops working. Unpublish it instead if you only want to take it offline for now.',
      icon: 'error',
      actionColor: 'danger',
      actionLabel: 'Delete Page',
      dangerZone: true,
    });
    if (!ok) return;

    setBusyId(page._id);
    try {
      await legalPageService.remove(page._id);
      invalidatePublicCache();
      dispatch(siteApi.util.invalidateTags([{ type: 'LegalPages', id: page.slug }]));
      showToast.success('Legal page deleted');
      fetchPages();
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setBusyId(null);
    }
  };

  const onSaved = () => {
    setShowForm(false);
    setEditing(null);
    invalidatePublicCache();
    if (editing?.slug) dispatch(siteApi.util.invalidateTags([{ type: 'LegalPages', id: editing.slug }]));
    fetchPages();
  };

  return (
    <div className="dashboard-card">
      <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h4 className="mb-0">Legal Pages</h4>
        <button type="button" className="btn btn-sm btn-primary" onClick={openCreate}>
          <i className="fas fa-plus me-2" aria-hidden="true" />New page
        </button>
      </div>
      <div className="card-body">
        <p className="text-muted">
          Terms &amp; Conditions, Privacy Policy and any other policy you need — refunds, cancellations,
          cookies. A published page is live at <code>/legal/&lt;slug&gt;</code> and linked from the footer;
          a draft is invisible to visitors.
        </p>

        {loading ? (
          <TableSkeleton rows={3} columns={5} />
        ) : pages.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-file-contract" aria-hidden="true"></i>
            <h5 className="mt-3 mb-2">No legal pages yet</h5>
            <p className="text-muted">
              Add your Terms &amp; Conditions and Privacy Policy so visitors know where they stand.
            </p>
            <button type="button" className="btn btn-primary mt-2" onClick={openCreate}>
              Create the first page
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">URL</th>
                  <th scope="col">Status</th>
                  <th scope="col">In footer</th>
                  <th scope="col">Last updated</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page._id}>
                    <td className="fw-semibold">{page.title}</td>
                    <td>
                      {page.status === 'published' ? (
                        <Link to={`/legal/${page.slug}`} target="_blank" rel="noopener noreferrer">
                          <code className="small">/legal/{page.slug}</code>
                        </Link>
                      ) : (
                        <code className="small text-muted">/legal/{page.slug}</code>
                      )}
                    </td>
                    <td>
                      {page.status === 'published'
                        ? <span className="badge bg-success">Published</span>
                        : <span className="badge bg-secondary">Draft</span>}
                    </td>
                    <td>{page.showInFooter ? 'Yes' : 'No'}</td>
                    <td>{page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : '—'}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className={`btn btn-sm me-2 ${page.status === 'published' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => togglePublish(page)}
                        disabled={busyId === page._id}
                      >
                        {page.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button" className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => openEdit(page)}
                        disabled={busyId === page._id}
                      >
                        {busyId === page._id ? 'Opening…' : 'Edit'}
                      </button>
                      <button
                        type="button" className="btn btn-sm btn-outline-danger"
                        onClick={() => remove(page)}
                        disabled={busyId === page._id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <LegalPageFormModal
          page={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
};

export default LegalPagesManagement;
