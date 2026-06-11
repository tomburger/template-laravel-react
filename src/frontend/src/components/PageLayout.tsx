import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  mainClassName?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, mainClassName = 'flex-grow-1 container my-2' }) => {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Header />
      <main className={mainClassName}>{children}</main>
      <Footer />
    </div>
  );
};

export default PageLayout;
