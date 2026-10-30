import React, { useEffect, useRef } from 'react';
import Modal from 'bootstrap/js/dist/modal';

interface Props {
  isOpen: boolean;
  title: React.ReactNode;
  children: React.ReactNode;
  confirmText: string;
  cancelText: string;
  busy?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmation dialog backed by Bootstrap's own Modal (focus trap, Escape, backdrop, scroll lock).
// `isOpen` stays the source of truth: Bootstrap-initiated closes are reported through onCancel.
const ConfirmModal: React.FC<Props> = ({
  isOpen,
  title,
  children,
  confirmText,
  cancelText,
  busy = false,
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const element = useRef<HTMLDivElement>(null);
  const modal = useRef<Modal | null>(null);
  const latest = useRef({ isOpen, onCancel });
  latest.current = { isOpen, onCancel };

  useEffect(() => {
    const node = element.current;
    if (!node) return;
    modal.current = new Modal(node, { backdrop: 'static', keyboard: false });
    const onHidden = () => {
      if (latest.current.isOpen) latest.current.onCancel();
    };
    node.addEventListener('hidden.bs.modal', onHidden);
    return () => {
      node.removeEventListener('hidden.bs.modal', onHidden);
      modal.current?.dispose();
      modal.current = null;
    };
  }, []);

  useEffect(() => {
    if (isOpen) modal.current?.show();
    else modal.current?.hide();
  }, [isOpen]);

  // Backdrop clicks and Escape are handled here so they can be blocked while busy
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, busy, onCancel]);

  return (
    <div
      ref={element}
      className="modal fade"
      tabIndex={-1}
      aria-hidden="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" aria-label={cancelText} onClick={onCancel} disabled={busy} />
          </div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>
              {cancelText}
            </button>
            <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-dark'}`} onClick={onConfirm} disabled={busy}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
