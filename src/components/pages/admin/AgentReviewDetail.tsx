import React, { useCallback, useEffect, useState } from 'react';
import { adminAgentService } from '../../../services/agentProfileService';
import { extractApiError } from '../../../services/agentProfileService';
import { showToast } from '../../../utils/toast';
import { type AdminAgentDetail } from '../../../types/agentProfile';
import { formatFileSize } from '../../../utils/formatFileSize';
import DocumentViewerModal from '../../common/DocumentViewerModal';
import ModalPortal from '../../common/ModalPortal';

interface AgentReviewDetailProps {
  agentId: string;
  onBack: () => void;
  onDecision: () => void;
}

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="row py-2 border-bottom">
    <dt className="col-sm-4 text-muted fw-normal">{label}</dt>
    <dd className="col-sm-8 mb-0">{value || <span className="text-muted fst-italic">Not provided</span>}</dd>
  </div>
);

const AgentReviewDetail: React.FC<AgentReviewDetailProps> = ({ agentId, onBack, onDecision }) => {
  const [agent, setAgent] = useState<AdminAgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [mode, setMode] = useState<'none' | 'approve' | 'reject'>('none');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionReasonDetails, setRejectionReasonDetails] = useState('');
  // Index into agent.documents of the document open in the viewer.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAgentService.getAgentById(agentId);
      setAgent(response.data.agent);
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  const closeModal = () => {
    setMode('none');
    setAdminNotes('');
    setRejectionReason('');
    setRejectionReasonDetails('');
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await adminAgentService.approveAgent(agentId, adminNotes.trim() || undefined);
      showToast.success('Agent approved — their profile is now publicly visible.');
      closeModal();
      await load();
      onDecision();
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast.error('A rejection reason is required');
      return;
    }
    setActing(true);
    try {
      await adminAgentService.rejectAgent(agentId, {
        rejectionReason: rejectionReason.trim(),
        rejectionReasonDetails: rejectionReasonDetails.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
      });
      showToast.success('Agent notified — they can revise and resubmit.');
      closeModal();
      await load();
      onDecision();
    } catch (error) {
      showToast.error(extractApiError(error).message);
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading agent…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="dashboard-card">
        <div className="card-body">
          <p className="mb-3">Agent profile not found.</p>
          <button type="button" className="btn btn-outline-secondary" onClick={onBack}>Back to list</button>
        </div>
      </div>
    );
  }

  const { basicInfo, businessDetails } = agent;
  const canDecide = agent.status === 'pending' || agent.status === 'rejected';

  return (
    <>
      <div className="dashboard-card mb-30">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="mb-0">{basicInfo.companyName || 'Untitled agency'}</h4>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onBack}>
            <i className="fas fa-arrow-left me-2" aria-hidden="true" />Back to list
          </button>
        </div>
        <div className="card-body">
          <div className="d-flex flex-wrap gap-3 align-items-center mb-20">
            <span className={`badge ${
              agent.status === 'approved' ? 'bg-success'
                : agent.status === 'pending' ? 'bg-warning text-dark'
                : agent.status === 'rejected' ? 'bg-danger' : 'bg-secondary'
            }`}>{agent.status}</span>
            <span className="text-muted">{agent.profileCompletionPercentage}% complete</span>
            {agent.submittedForReviewAt && (
              <span className="text-muted">
                Submitted {new Date(agent.submittedForReviewAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {agent.status === 'rejected' && agent.rejectionReason && (
            <div className="alert alert-danger" role="alert">
              <strong>Previously rejected:</strong> {agent.rejectionReason}
              {agent.rejectionReasonDetails && <div>{agent.rejectionReasonDetails}</div>}
            </div>
          )}

          <h6 className="fw-semibold mb-2">Account</h6>
          <dl className="mb-30">
            <Row label="Account name" value={agent.account?.fullName} />
            <Row label="Login email" value={agent.account?.email} />
            <Row label="Subscription" value={agent.account?.subscription?.name} />
            <Row
              label="Registered"
              value={agent.account?.createdAt && new Date(agent.account.createdAt).toLocaleDateString()}
            />
          </dl>

          <h6 className="fw-semibold mb-2">Basic information</h6>
          <dl className="mb-30">
            <Row label="Company" value={basicInfo.companyName} />
            <Row label="Owner" value={basicInfo.ownerName} />
            <Row label="Phone" value={basicInfo.phone} />
            <Row label="WhatsApp" value={basicInfo.whatsapp} />
            <Row label="Business email" value={basicInfo.email} />
            <Row
              label="Website"
              value={basicInfo.website && (
                <a href={basicInfo.website} target="_blank" rel="noopener noreferrer">{basicInfo.website}</a>
              )}
            />
            <Row
              label="Location"
              value={[basicInfo.businessLocation, basicInfo.city, basicInfo.province].filter(Boolean).join(', ')}
            />
            <Row label="Office address" value={basicInfo.officeAddress} />
          </dl>

          <h6 className="fw-semibold mb-2">Business details</h6>
          <dl className="mb-30">
            <Row label="Description" value={businessDetails.companyDescription} />
            <Row
              label="Experience"
              value={businessDetails.yearsExperience !== undefined && businessDetails.yearsExperience !== ''
                ? `${businessDetails.yearsExperience} years` : undefined}
            />
            <Row label="Services offered" value={businessDetails.servicesOffered} />
            <Row label="Areas served" value={businessDetails.areaServed?.join(', ')} />
            <Row
              label="Social media"
              value={businessDetails.socialMedia && Object.entries(businessDetails.socialMedia)
                .filter(([, url]) => url)
                .map(([platform, url]) => (
                  <a key={platform} href={url} className="me-3" target="_blank" rel="noopener noreferrer">
                    {platform}
                  </a>
                ))}
            />
          </dl>

          <h6 className="fw-semibold mb-2">Service categories</h6>
          <p className="mb-30">
            {agent.categories.length > 0
              ? agent.categories.map((category) => (
                  <span key={category._id} className="badge bg-primary me-2">{category.name}</span>
                ))
              : <span className="text-muted fst-italic">None selected</span>}
          </p>

          <h6 className="fw-semibold mb-2">Verification documents ({agent.documents.length})</h6>
          {agent.documents.length === 0 ? (
            <p className="text-muted mb-0">No documents uploaded.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">File</th>
                    <th scope="col">Size</th>
                    <th scope="col">Uploaded</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.documents.map((document, documentIndex) => (
                    <tr key={document._id}>
                      <td>{document.name}</td>
                      <td className="text-muted">{document.fileName}</td>
                      <td className="text-muted">{formatFileSize(document.fileSize)}</td>
                      <td className="text-muted">{new Date(document.uploadedAt).toLocaleDateString()}</td>
                      <td><span className="badge bg-secondary">{document.status}</span></td>
                      <td className="text-end">
                        {document.fileUrl ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setViewerIndex(documentIndex)}
                          >
                            View
                          </button>
                        ) : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {canDecide && (
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-danger" onClick={() => setMode('reject')}>
                Request changes
              </button>
              <button type="button" className="btn btn-success" onClick={() => setMode('approve')}>
                Approve
              </button>
            </div>
          )}
        </div>
      </div>

      {mode !== 'none' && (
        <ModalPortal>
          <div
            className="modal-overlay admin-modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={(event) => { if (event.target === event.currentTarget && !acting) closeModal(); }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="modal-dialog modal-dialog-centered m-0" style={{ width: '100%', maxWidth: 500 }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {mode === 'approve' ? 'Approve this agent?' : 'Request changes'}
                  </h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  {mode === 'approve' ? (
                    <p>
                      <strong>{basicInfo.companyName}</strong> becomes publicly visible straight away, and the
                      documents attached to this profile are marked approved.
                    </p>
                  ) : (
                    <p>The agent sees your reason, can edit their profile, and can submit again.</p>
                  )}

                  {mode === 'reject' && (
                    <>
                      <div className="mb-20">
                        <label htmlFor="rejection-reason" className="form-label fw-semibold">
                          Reason<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          id="rejection-reason" type="text" className="form-control"
                          value={rejectionReason}
                          onChange={(event) => setRejectionReason(event.target.value)}
                          placeholder="e.g. Business licence is unreadable"
                        />
                      </div>
                      <div className="mb-20">
                        <label htmlFor="rejection-details" className="form-label fw-semibold">Details</label>
                        <textarea
                          id="rejection-details" className="form-control" rows={3}
                          value={rejectionReasonDetails}
                          onChange={(event) => setRejectionReasonDetails(event.target.value)}
                          placeholder="Explain exactly what the agent needs to change."
                        />
                      </div>
                    </>
                  )}

                  <div className="mb-0">
                    <label htmlFor="admin-notes" className="form-label fw-semibold">
                      Note to the agent <span className="text-muted fw-normal">(optional)</span>
                    </label>
                    <textarea
                      id="admin-notes" className="form-control" rows={3}
                      value={adminNotes}
                      onChange={(event) => setAdminNotes(event.target.value)}
                      placeholder="Only this agent sees this — it is never shown publicly."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={acting}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn ${mode === 'approve' ? 'btn-success' : 'btn-danger'}`}
                    onClick={mode === 'approve' ? handleApprove : handleReject}
                    disabled={acting || (mode === 'reject' && !rejectionReason.trim())}
                  >
                    {acting ? 'Saving…' : mode === 'approve' ? 'Approve agent' : 'Send back to agent'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {viewerIndex !== null && (
        <DocumentViewerModal
          documents={agent.documents}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
};

export default AgentReviewDetail;
