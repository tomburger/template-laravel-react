import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 1 }}>
      <LanguageSwitcher />
    </div>
    {children}
  </>
);

export default PublicRoute;
