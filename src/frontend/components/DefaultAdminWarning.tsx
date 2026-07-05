import React from 'react';
import { Link } from 'react-router-dom';

type DefaultAdminWarningProps = {
  userId?: number;
  isAdmin?: boolean;
};

const DefaultAdminWarning: React.FC<DefaultAdminWarningProps> = ({ userId, isAdmin }) => {
  if (userId !== 1 || !isAdmin) {
    return null;
  }

  return (
    <div className="alert alert-warning border-warning mb-4" role="alert">
      <strong>Security warning:</strong> You are using the default admin account.
      <span className="ms-2">
        Create a new non-default admin user, then remove admin access and deactivate this account.
      </span>
      <div className="mt-2">
        <Link to="/admin/users" className="btn btn-sm btn-outline-dark">
          Open User Register
        </Link>
      </div>
    </div>
  );
};

export default DefaultAdminWarning;