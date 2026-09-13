import React from 'react';
import { APP_NAME } from '../config';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-light border-top mt-2 py-4">
      <div className="container">
        <div className="row">
          <div className="col-12 text-center">
            <p className="text-muted mb-0">
              &copy; {currentYear} {APP_NAME} 1.0.[[VERSION]]. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
