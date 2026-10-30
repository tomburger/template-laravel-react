import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LANGUAGES } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useAuth();

  return (
    <select
      className="form-select form-select-sm w-auto"
      aria-label={t('header.language')}
      value={i18n.resolvedLanguage}
      onChange={(e) => setLanguage(e.target.value).catch(() => {})}
    >
      {SUPPORTED_LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;
