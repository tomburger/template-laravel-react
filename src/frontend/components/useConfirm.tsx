import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';

interface ConfirmOptions {
  message: React.ReactNode;
  confirmText: string;
  title?: React.ReactNode;
}

// Drop-in replacement for window.confirm: `if (!(await confirm({...}))) return;`
// Render the returned `dialog` once in the component.
export const useConfirm = () => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOptions(next);
      }),
    []
  );

  const settle = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setOptions(null);
  }, []);

  const dialog = (
    <ConfirmModal
      isOpen={options !== null}
      title={options?.title ?? t('common.confirm')}
      confirmText={options?.confirmText ?? ''}
      cancelText={t('adminUsers.cancel')}
      danger
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    >
      {options?.message}
    </ConfirmModal>
  );

  return { confirm, dialog };
};
