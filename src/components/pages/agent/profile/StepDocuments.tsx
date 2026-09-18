import React, { useRef, useState } from 'react';
import { agentProfileService, extractApiError } from '../../../../services/agentProfileService';
import { showToast } from '../../../../utils/toast';
import { type AgentProfile } from '../../../../types/agentProfile';
import { formatFileSize } from '../../../../utils/formatFileSize';
import { useConfirm } from '../../../../contexts/ConfirmContext';
import DocumentViewerModal from '../../../common/DocumentViewerModal';

interface StepDocumentsProps {
  profile: AgentProfile;
  locked: boolean;
  onRefresh: () => Promise<void> | void;
  onBack: () => void;
  onNext: () => void;
}

// Mirrors the server-side limits in lib/agentProfile.ts so the agent finds out
// a file is too big before spending time uploading it.
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const NAME_PATTERN = /^[a-zA-Z0-9\s\-.]+$/;

const documentStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    pending: 'bg-warning text-dark',
    approved: 'bg-success',
    rejected: 'bg-danger',
  };
  return <span className={`badge ${variants[status] || 'bg-secondary'}`}>{status}</span>;
};

const StepDocuments: React.FC<StepDocumentsProps> = ({ profile, locked, onRefresh, onBack, onNext }) => {
  const [documentName, setDocumentName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Index into profile.documents of the document open in the viewer.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const resetPicker = () => {
    setFile(null);
    setDocumentName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_BYTES) {
      setError(`"${selected.name}" is ${formatFileSize(selected.size)} — the limit is 10 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Only PDF, JPG and PNG files are accepted.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError('');
    setFile(selected);
  };

  const handleUpload = async () => {
    const name = documentName.trim();
    if (!file) return setError('Choose a file to upload.');
    if (name.length < 3 || name.length > 100) return setError('Document name must be 3-100 characters.');
    if (!NAME_PATTERN.test(name)) return setError('Use letters, numbers, spaces, hyphens and periods only.');

    setUploading(true);
    setProgress(0);
    setError('');
    try {
      await agentProfileService.uploadDocument(file, name, setProgress);
      resetPicker();
      await onRefresh();
      showToast.success('Document uploaded');
    } catch (uploadError) {
      const parsed = extractApiError(uploadError);
      setError(parsed.errors?.documentName || parsed.message);
      showToast.error(parsed.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (documentId: string, name: string) => {
    const ok = await confirm({
      title: 'Delete Document',
      subtitle: name,
      heading: 'Remove This Document',
      description: 'The uploaded file will be permanently deleted. You can upload a replacement afterwards.',
      icon: 'error',
      actionColor: 'danger',
      actionLabel: 'Delete Document',
      dangerZone: true,
    });
    if (!ok) return;
    setDeletingId(documentId);
    try {
      await agentProfileService.deleteDocument(documentId);
      await onRefresh();
      showToast.success('Document deleted');
    } catch (deleteError) {
      showToast.error(extractApiError(deleteError).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h4>Step 4 — Verification documents</h4>
      </div>
      <div className="card-body">
        <div className="alert alert-info" role="note">
          Upload documents that prove your business is real — a trade licence, tour operator licence, NTN
          certificate. Only you and our review team can open them; they are never shown publicly.
        </div>

        {!locked && (
          <div className="border rounded p-3 mb-30">
            <div className="mb-20">
              <label htmlFor="agent-document-name" className="form-label fw-semibold">
                Document name<span className="text-danger ms-1">*</span>
              </label>
              <input
                id="agent-document-name"
                type="text"
                className="form-control"
                value={documentName}
                onChange={(event) => setDocumentName(event.target.value)}
                placeholder="e.g. Business License"
                maxLength={100}
                disabled={uploading}
              />
            </div>

            <div className="mb-20">
              <span className="form-label fw-semibold d-block">
                File<span className="text-danger ms-1">*</span>
              </span>
              <input
                ref={fileInputRef}
                id="agent-document-file"
                type="file"
                className="form-control"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={uploading}
                aria-describedby="agent-document-file-hint"
              />
              <small id="agent-document-file-hint" className="text-muted">
                PDF, JPG or PNG — up to 10 MB.
                {file && <> Selected: <strong>{file.name}</strong> ({formatFileSize(file.size)})</>}
              </small>
            </div>

            {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

            {uploading && (
              <div className="mb-20">
                <div className="d-flex justify-content-between">
                  <small>Uploading…</small>
                  <small>{progress}%</small>
                </div>
                <div
                  className="progress" style={{ height: 6 }} role="progressbar"
                  aria-label="Upload progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}
                >
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading || !file || !documentName.trim()}
            >
              {uploading ? 'Uploading…' : 'Upload document'}
            </button>
          </div>
        )}

        <h6 className="fw-semibold mb-2">Uploaded documents ({profile.documents.length})</h6>
        {profile.documents.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-file-upload" aria-hidden="true"></i>
            <h5 className="mt-3 mb-2">No documents yet</h5>
            <p className="text-muted">
              Documents are optional, but a profile with proof of business is approved far faster.
            </p>
          </div>
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
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profile.documents.map((document, documentIndex) => (
                  <tr key={document._id}>
                    <td>
                      {document.name}
                      {document.adminNotes && (
                        <small className="d-block text-danger">{document.adminNotes}</small>
                      )}
                    </td>
                    <td className="text-muted">{document.fileName}</td>
                    <td className="text-muted">{formatFileSize(document.fileSize)}</td>
                    <td className="text-muted">{new Date(document.uploadedAt).toLocaleDateString()}</td>
                    <td>{documentStatusBadge(document.status)}</td>
                    <td className="text-end">
                      {document.fileUrl && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={() => setViewerIndex(documentIndex)}
                        >
                          View
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(document._id, document.name)}
                        disabled={locked || deletingId === document._id}
                      >
                        {deletingId === document._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex justify-content-between gap-2 mt-3">
          <button type="button" className="btn btn-outline-secondary" onClick={onBack}>Back</button>
          <button type="button" className="btn btn-primary" onClick={onNext}>Continue to review</button>
        </div>
      </div>

      {viewerIndex !== null && (
        <DocumentViewerModal
          documents={profile.documents}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
};

export default StepDocuments;
