import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import LegalPageFormModal from './LegalPageFormModal';
import { Badge, Button, DataTable, IconButton, type DataTableColumn } from '../../ui';
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

  const columns: DataTableColumn<LegalPageSummary>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (page) => <span className="fw-semibold">{page.title}</span>,
    },
    {
      key: 'url',
      header: 'URL',
      hideBelow: 'md',
      render: (page) => (page.status === 'published' ? (
        <Link to={`/legal/${page.slug}`} target="_blank" rel="noopener noreferrer">
          <code className="small">/legal/{page.slug}</code>
        </Link>
      ) : (
        <code className="small text-muted">/legal/{page.slug}</code>
      )),
    },
    {
      key: 'status',
      header: 'Status',
      nowrap: true,
      render: (page) => (page.status === 'published'
        ? <Badge tone="success" dot>Published</Badge>
        : <Badge tone="neutral" dot>Draft</Badge>),
    },
    {
      key: 'footer',
      header: 'In footer',
      hideBelow: 'lg',
      render: (page) => (page.showInFooter ? 'Yes' : 'No'),
    },
    {
      key: 'updated',
      header: 'Last updated',
      nowrap: true,
      hideBelow: 'md',
      render: (page) => (page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '132px',
      render: (page) => (
        <div className="ui-actions">
          <IconButton
            icon={page.status === 'published' ? 'far fa-eye-slash' : 'far fa-paper-plane'}
            label={page.status === 'published' ? 'Unpublish' : 'Publish'}
            tone={page.status === 'published' ? 'warning' : 'success'}
            onClick={() => togglePublish(page)}
            disabled={busyId === page._id}
          />
          <IconButton
            icon="far fa-pen-to-square"
            label="Edit"
            onClick={() => openEdit(page)}
            loading={busyId === page._id}
          />
          <IconButton
            icon="far fa-trash-can"
            label="Delete"
            tone="danger"
            onClick={() => remove(page)}
            disabled={busyId === page._id}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-card">
      <div className="card-body">
        <p className="text-muted">
          Terms &amp; Conditions, Privacy Policy and any other policy you need — refunds, cancellations,
          cookies. A published page is live at <code>/legal/&lt;slug&gt;</code> and linked from the footer;
          a draft is invisible to visitors.
        </p>

        <DataTable<LegalPageSummary>
          columns={columns}
          rows={pages}
          rowKey={(page) => page._id}
          pagination={{ noun: 'pages' }}
          title="Legal Pages"
          loading={loading}
          search={{ placeholder: 'Search by title or URL…', keys: ['title', 'slug'] }}
          actions={<Button icon="fas fa-plus" size="sm" onClick={openCreate}>New page</Button>}
          emptyState={{
            icon: 'fas fa-file-contract',
            title: 'No legal pages yet',
            description: 'Add your Terms & Conditions and Privacy Policy so visitors know where they stand.',
            action: <Button onClick={openCreate}>Create the first page</Button>,
          }}
        />
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
