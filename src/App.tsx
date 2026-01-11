import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { isAuthed } from './storage/authStorage'
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
