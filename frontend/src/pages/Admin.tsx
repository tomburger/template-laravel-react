import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Admin: React.FC = () => {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Header />

      <main className="flex-grow-1 container my-5">
        <div className="row">
          <div className="col-md-10 mx-auto">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <h1 className="card-title mb-4">Admin Panel</h1>
                <div className="alert alert-info" role="alert">
                  Welcome to the admin panel. More features coming soon.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
