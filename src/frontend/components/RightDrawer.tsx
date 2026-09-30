import React from 'react';

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  closeText: string;
  disableClose?: boolean;
  ariaLabel?: string;
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const RightDrawer: React.FC<RightDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  closeText,
  disableClose = false,
  ariaLabel,
  width = 'min(92vw, 560px)',
  children,
  footer,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (!disableClose) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
        style={{ opacity: 0.35, zIndex: 1040 }}
        onClick={handleClose}
      />
      <aside
        className="position-fixed top-0 end-0 h-100 bg-white border-start shadow-lg d-flex flex-column"
        style={{ width, zIndex: 1045 }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <div className="d-flex align-items-center justify-content-between border-bottom px-4 py-3">
          <div>
            <h5 className="mb-0">{title}</h5>
            {subtitle && <div className="small text-muted">{subtitle}</div>}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleClose}
            disabled={disableClose}
          >
            {closeText}
          </button>
        </div>

        <div className="flex-grow-1 overflow-auto p-4">{children}</div>

        {footer && <div className="border-top px-4 py-3">{footer}</div>}
      </aside>
    </>
  );
};

export default RightDrawer;