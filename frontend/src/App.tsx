import { useEffect, useState } from 'react'

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('checking...')

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setHealthStatus('API is running ✓')
        }
      })
      .catch(() => {
        setHealthStatus('API connection failed')
      })
  }, [])

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              <h1 className="card-title mb-4">Laravel + React Template</h1>
              <p className="card-text mb-3">Headless API with React UI</p>
              <div className="alert alert-info" role="alert">
                {healthStatus}
              </div>
              <div className="mt-4">
                <p className="text-muted small">
                  Edit <code>src/App.tsx</code> to get started
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
