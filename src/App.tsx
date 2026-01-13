import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { isAuthed } from './storage/authStorage'
import { initAuthFromRefresh } from './services/api'
import LoginPage from './pages/LoginPage'
import MentDetailPage from './pages/MentDetailPage'
import MentEditorPage from './pages/MentEditorPage'
import MentListPage from './pages/MentListPage'
import AuthStartPage from './pages/AuthStartPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import './i18n/config'

function RequireAuth({ children }: { children: React.ReactElement }) {
  const location = useLocation()
  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

export default function App() {
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await initAuthFromRefresh()
      } finally {
        if (mounted) setInitializing(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-600">로딩 중...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/ments" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/start" element={<AuthStartPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route
        path="/ments"
        element={
          <RequireAuth>
            <MentListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/ments/new"
        element={
          <RequireAuth>
            <MentEditorPage />
          </RequireAuth>
        }
      />
      <Route
        path="/ments/:id"
        element={
          <RequireAuth>
            <MentDetailPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/ments" replace />} />
    </Routes>
  )
}
