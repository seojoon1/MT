import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { isAuthed } from './storage/authStorage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import AuthStartPage from './pages/AuthStartPage'
import FavoritesPage from './pages/FavoritesPage'
import LoginPage from './pages/LoginPage'
import MentDetailPage from './pages/MentDetailPage'
import MentEditorPage from './pages/MentEditorPage'
import MentListPage from './pages/MentListPage'
import PlannerPage from './pages/PlannerPage'
import ResultPage from './pages/ResultPage'

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
      <Route path="/" element={<Navigate to="/planner" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/:provider" element={<AuthStartPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route
        path="/planner"
        element={
          <RequireAuth>
            <PlannerPage />
          </RequireAuth>
        }
      />
      <Route
        path="/result"
        element={
          <RequireAuth>
            <ResultPage />
          </RequireAuth>
        }
      />
      <Route
        path="/favorites"
        element={
          <RequireAuth>
            <FavoritesPage />
          </RequireAuth>
        }
      />

      <Route path="/ments" element={<MentListPage />} />
      <Route path="/ments/new" element={<MentEditorPage />} />
      <Route path="/ments/:id" element={<MentDetailPage />} />
      <Route path="*" element={<Navigate to="/ments" replace />} />
    </Routes>
  )
}
