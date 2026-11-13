import React, { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getEndpoints } from '../services/endpoints/endpoints';
import { UserOption, apiErrorMessage, authRequestOptions } from '../services/apiHelpers';

interface ContentEditorsSelectorProps {
  value: UserOption[];
  onChange: (users: UserOption[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  label?: string;
  emptyText?: string;
}

type AvailableUser = UserOption & { is_admin: boolean };

const ContentEditorsSelector: React.FC<ContentEditorsSelectorProps> = ({ value, onChange, disabled = false, readOnly = false, label, emptyText }) => {
  const { t } = useTranslation();
  const inputId = useId();
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [isLoading, setIsLoading] = useState(!readOnly);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (readOnly) {
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const loadUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getEndpoints().listAllUsers<{ data: { users: AvailableUser[] } }>(authRequestOptions());
        if (!isCancelled) {
          setAvailableUsers(response.data.users.sort((left, right) => left.name.localeCompare(right.name)));
        }
      } catch (err) {
        if (!isCancelled) {
          setError(apiErrorMessage(err, t('contentEditorsSelector.loadFailed')));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadUsers();
    return () => { isCancelled = true; };
  }, [readOnly, t]);

  const selectedIds = useMemo(() => new Set(value.map((user) => user.id)), [value]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = useMemo(() => (
    availableUsers
      .filter((user) => !selectedIds.has(user.id))
      .filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 8)
  ), [availableUsers, normalizedQuery, selectedIds]);
  const showDropdown = !disabled && !readOnly && isFocused && (normalizedQuery.length > 0 || filteredUsers.length > 0);

  const selectUser = (user: UserOption) => {
    if (!selectedIds.has(user.id)) {
      onChange([...value, user]);
    }
    setQuery('');
  };

  const removeUser = (userId: number) => onChange(value.filter((user) => user.id !== userId));

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredUsers.length > 0) selectUser(filteredUsers[0]);
    }
    if (event.key === 'Backspace' && !query && value.length > 0) {
      removeUser(value[value.length - 1].id);
    }
  };

  return (
    <div className="mb-4" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
    }}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        {readOnly
          ? <span className="form-label fw-semibold mb-0">{label ?? t('contentEditorsSelector.label')}</span>
          : <label className="form-label fw-semibold mb-0" htmlFor={inputId}>{label ?? t('contentEditorsSelector.label')}</label>}
        <span className="badge text-bg-light border text-secondary">
          {t('contentEditorsSelector.selected', { count: value.length })}
        </span>
      </div>

      <div className="border rounded-4 bg-white shadow-sm p-3 position-relative">
        <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
          {value.length > 0 ? value.map((user) => (
            <span key={user.id} className="badge rounded-pill text-bg-dark d-inline-flex align-items-center gap-2 px-3 py-2">
              <span>{user.name}</span>
              <span className="opacity-75">{user.email}</span>
              {!disabled && !readOnly && (
                <button
                  type="button"
                  className="btn btn-sm border-0 p-0 text-white"
                  aria-label={t('contentEditorsSelector.remove', { name: user.name })}
                  onClick={() => removeUser(user.id)}
                  style={{ lineHeight: 1 }}
                >
                  &times;
                </button>
              )}
            </span>
          )) : (
            <span className="text-muted small fst-italic">{emptyText ?? t('contentEditorsSelector.none')}</span>
          )}
        </div>

        {!readOnly && (
          <input
            id={inputId}
            type="text"
            className="form-control form-control-lg"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={t('contentEditorsSelector.searchPlaceholder')}
            disabled={disabled || isLoading}
          />
        )}
        <div className="form-text mt-2">{t(readOnly ? 'owners.readOnly' : 'contentEditorsSelector.hint')}</div>
        {error && <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>}
        {isLoading && <div className="text-muted small mt-2">{t('common.loading')}</div>}

        {showDropdown && (
          <div className="dropdown-menu show w-100 mt-2 border-0 shadow rounded-4 p-2" style={{ display: 'block' }}>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className="dropdown-item rounded-3 py-2"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectUser(user)}
              >
                <div className="d-flex justify-content-between align-items-center gap-3">
                  <div className="text-start">
                    <div className="fw-semibold">{user.name}</div>
                    <div className="text-muted small">{user.email}</div>
                  </div>
                  {user.is_admin && <span className="badge text-bg-warning">{t('adminUsers.admin')}</span>}
                </div>
              </button>
            )) : (
              <div className="px-3 py-2 text-muted small">{t('contentEditorsSelector.noMatches')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentEditorsSelector;
