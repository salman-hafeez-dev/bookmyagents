import React, { useCallback, useEffect, useState } from 'react';
import ModalPortal from './ModalPortal';
import { formatFileSize } from '../../utils/formatFileSize';
import { type AgentDocument } from '../../types/agentProfile';

interface DocumentViewerModalProps {
  documents: AgentDocument[];
  initialIndex: number;
  onClose: () => void;
}

const isImage = (fileType: string) => fileType.startsWith('image/');
const isPdf = (fileType: string) => fileType === 'application/pdf';

const statusBadgeClass = (status: string) => {
  const variants: Record<string, string> = {
    pending: 'bg-warning text-dark',
    approved: 'bg-success',
    rejected: 'bg-danger',
  };
  return variants[status] || 'bg-secondary';
};

/**
 * Full-screen viewer for an agent's verification documents.
 *
 * The whole set is loaded at once so a reviewer can page through every
 * document without closing and reopening — the thumbnail strip and the
 * arrow keys both move between them.
 *
 * Files are private Cloudinary assets, so `fileUrl` is a signed URL minted by
 * the API for this viewer only. A document arriving without one renders an
 * explicit unavailable state rather than a broken frame.
 */
const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documents,
  initialIndex,
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex);
  // Keyed by document id: a signed URL can still fail to render (an expired
  // signature, a Cloudinary PDF-delivery restriction), and we want to say so
  // rather than leave an empty box.
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const total = documents.length;
  const current = documents[index];

  const goTo = useCallback((next: number) => {
    if (total === 0) return;
    // Wrap around, so paging past either end continues through the set.
    setIndex(((next % total) + total) % total);
  }, [total]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') goTo(index + 1);
      if (event.key === 'ArrowLeft') goTo(index - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, goTo, onClose]);

  if (!current) return null;

  const markFailed = (id: string) => setFailed((previous) => ({ ...previous, [id]: true }));
  const hasFailed = failed[current._id];

  const renderViewer = () => {
    if (!current.fileUrl) {
      return (
        <div className="text-center text-white-50">
          <i className="fas fa-lock fa-3x mb-3" aria-hidden="true" />
          <p className="mb-0">This document isn&apos;t available to view.</p>
        </div>
      );
    }

    if (hasFailed) {
      return (
        <div className="text-center text-white-50">
          <i className="fas fa-triangle-exclamation fa-3x mb-3" aria-hidden="true" />
          <p className="mb-2">This document couldn&apos;t be displayed here.</p>
          <a href={current.fileUrl} className="btn btn-sm btn-light" target="_blank" rel="noopener noreferrer">
            Open in a new tab
          </a>
        </div>
      );
    }

    if (isImage(current.fileType)) {
      return (
        <img
          src={current.fileUrl}
          alt={current.name}
          onError={() => markFailed(current._id)}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      );
    }

    if (isPdf(current.fileType)) {
      return (
        <iframe
          src={current.fileUrl}
          title={current.name}
          onError={() => markFailed(current._id)}
          style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
        />
      );
    }

    return (
      <div className="text-center text-white-50">
        <i className="fas fa-file fa-3x mb-3" aria-hidden="true" />
        <p className="mb-2">{current.fileType} can&apos;t be previewed.</p>
        <a href={current.fileUrl} className="btn btn-sm btn-light" target="_blank" rel="noopener noreferrer">
          Open in a new tab
        </a>
      </div>
    );
  };

  return (
    <ModalPortal>
      <div
        className="modal-overlay admin-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`Document viewer: ${current.name}`}
        onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.75)',
        }}
      >
        <div
          className="d-flex flex-column rounded overflow-hidden"
          style={{ width: '80vw', height: '80vh', background: '#1f2329', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}
        >
          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between gap-3 px-3 py-2 flex-shrink-0"
            style={{ background: '#2a2f36' }}
          >
            <div className="text-white text-truncate">
              <strong className="d-block text-truncate">{current.name}</strong>
              <small className="text-white-50">
                {current.fileName} · {formatFileSize(current.fileSize)}
                {total > 1 && <> · {index + 1} of {total}</>}
              </small>
            </div>

            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <span className={`badge ${statusBadgeClass(current.status)}`}>{current.status}</span>
              {current.fileUrl && (
                <a
                  href={current.fileUrl}
                  className="btn btn-sm btn-outline-light"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in a new tab"
                >
                  <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
                  <span className="visually-hidden">Open in a new tab</span>
                </a>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={onClose}
                aria-label="Close viewer"
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Viewer */}
          <div
            className="flex-grow-1 d-flex align-items-center justify-content-center p-3"
            style={{ minHeight: 0, overflow: 'auto' }}
          >
            {renderViewer()}
          </div>

          {/* Admin notes on a rejected document belong with the document itself. */}
          {current.adminNotes && (
            <div className="px-3 py-2 flex-shrink-0 text-white-50" style={{ background: '#2a2f36' }}>
              <small><strong className="text-white">Reviewer note:</strong> {current.adminNotes}</small>
            </div>
          )}

          {/* Thumbnail strip — only earns its space when there's more than one */}
          {total > 1 && (
            <div
              className="d-flex align-items-center gap-2 px-3 py-2 flex-shrink-0"
              style={{ background: '#2a2f36' }}
            >
              <button
                type="button"
                className="btn btn-sm btn-outline-light flex-shrink-0"
                onClick={() => goTo(index - 1)}
                aria-label="Previous document"
              >
                <i className="fas fa-chevron-left" aria-hidden="true" />
              </button>

              <div className="d-flex gap-2 flex-grow-1" style={{ overflowX: 'auto', minWidth: 0 }}>
                {documents.map((document, documentIndex) => {
                  const active = documentIndex === index;
                  return (
                    <button
                      key={document._id}
                      type="button"
                      onClick={() => goTo(documentIndex)}
                      title={document.name}
                      aria-label={`View ${document.name}`}
                      aria-current={active}
                      className="btn p-0 flex-shrink-0 d-flex align-items-center justify-content-center overflow-hidden"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 6,
                        background: '#15181c',
                        border: active ? '2px solid #0d6efd' : '2px solid transparent',
                        opacity: active ? 1 : 0.65,
                      }}
                    >
                      {isImage(document.fileType) && document.fileUrl && !failed[document._id] ? (
                        <img
                          src={document.fileUrl}
                          alt=""
                          onError={() => markFailed(document._id)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <i
                          className={`fas ${isPdf(document.fileType) ? 'fa-file-pdf' : 'fa-file'} text-white-50`}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-light flex-shrink-0"
                onClick={() => goTo(index + 1)}
                aria-label="Next document"
              >
                <i className="fas fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default DocumentViewerModal;
