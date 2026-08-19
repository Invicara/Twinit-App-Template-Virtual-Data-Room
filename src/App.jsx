import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { IafSession } from '@dtplatform/platform-api'
import { initiateAuth, handleAuthCallback, getAccessToken } from './auth/auth'
import { authEvents } from './services/apiFetch'
import { UserProvider } from './context/UserContext'
import { ProjectProvider } from './context/ProjectContext'
import Header from './components/Header'
import VirtualDataRoom from './pages/VirtualDataRoom'
import TrashBin from './pages/TrashBin'
import ManageUsers from './pages/ManageUsers'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
})

function App() {
  const [authStatus, setAuthStatus] = useState('loading')
  const [authError, setAuthError] = useState(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const handler = () => setSessionExpired(true)
    authEvents.addEventListener('session-expired', handler)
    return () => authEvents.removeEventListener('session-expired', handler)
  }, [])

  useEffect(() => {
    const init = async () => {

      await IafSession.setConfig({
        itemServiceOrigin: import.meta.env.VITE_TWINIT_API,
        passportServiceOrigin: import.meta.env.VITE_TWINIT_API,
        fileServiceOrigin: import.meta.env.VITE_TWINIT_API,
        datasourceServiceOrigin: import.meta.env.VITE_TWINIT_API,
        graphicsServiceOrigin: import.meta.env.VITE_TWINIT_API,
        objectModelServiceOrigin: import.meta.env.VITE_TWINIT_API,
        metricsServiceOrigin: import.meta.env.VITE_TWINIT_API,
        notificationServiceOrigin: import.meta.env.VITE_TWINIT_API,
        aisvcServiceOrigin: import.meta.env.VITE_TWINIT_API,
        workflowServiceOrigin: import.meta.env.VITE_TWINIT_API,
      })

      IafSession.setErrorCallback((error) => {
        if (error.status === 401) {
          authEvents.dispatchEvent(new Event('session-expired'))
        } else {
          throw (error)
        }
      })

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        try {
          await handleAuthCallback(code)
          window.history.replaceState({}, '', window.location.pathname)
          setAuthStatus('authenticated')
        } catch (err) {
          setAuthError(err.message)
          setAuthStatus('error')
        }
      } else if (getAccessToken()) {
        await IafSession.setAuthToken(getAccessToken())
        setAuthStatus('authenticated')
      } else {
        await initiateAuth()
      }
    }

    init()
  }, [])

  if (authStatus === 'loading') return <div className="auth-status">Signing in...</div>
  if (authStatus === 'error') return <div className="auth-status auth-error">Authentication failed: {authError}</div>

  return (
    <QueryClientProvider client={queryClient}>
      {sessionExpired && (
        <div className="session-expired-overlay">
          <div className="session-expired-dialog">
            <svg className="session-expired-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2>Session Expired</h2>
            <p>Your session has expired. Please sign in again to continue.</p>
            <button className="session-expired-btn" onClick={() => initiateAuth()}>
              Sign In
            </button>
          </div>
        </div>
      )}
      <BrowserRouter>
        <ProjectProvider>
          <UserProvider>
            <Header />
            <section id="center">
              <Routes>
                <Route path="/" element={<VirtualDataRoom />} />
                <Route path="/trash" element={<TrashBin />} />
                <Route path="/manage-users" element={<ManageUsers />} />
              </Routes>
            </section>
          </UserProvider>
        </ProjectProvider>
      </BrowserRouter>  
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
