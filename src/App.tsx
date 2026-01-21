import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { isAuthed, clearAuthed } from './storage/authStorage'
import { initAuthFromRefresh } from './services/api'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage' // เพิ่ม import
import HomePage from './pages/HomePage'
import MentDetailPage from './pages/MentDetailPage'
import MentEditorPage from './pages/MentEditorPage'
import MentListPage from './pages/MentListPage'
import AuthStartPage from './pages/AuthStartPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import Navbar from './components/layout/Navbar'
import './i18n/config'

function RequireAuth({ children }: { children: React.ReactElement }) {
  const location = useLocation()
  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

// Layout เดียวที่มี Navbar เสมอ
function AppLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = isAuthed();
  
  const handleLogout = () => {
    clearAuthed();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      {/* Navbar แสดงตลอด */}
      <Navbar 
        isAuthenticated={isAuthenticated}
        username={isAuthenticated ? 'User' : undefined}
        onLogout={handleLogout}
      />
      <main className="py-4">
        {children}
      </main>
    </div>
  );
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
      {/* หน้า Home */}
      <Route 
        path="/" 
        element={
          <AppLayout>
            <HomePage />
          </AppLayout>
        } 
      />
      
      {/* หน้า Login */}
      <Route 
        path="/login" 
        element={
          <AppLayout>
            <LoginPage />
          </AppLayout>
        } 
      />
      
      {/* หน้า Register */}
      <Route 
        path="/register" 
        element={
          <AppLayout>
            <RegisterPage />
          </AppLayout>
        } 
      />
      
      <Route 
        path="/auth/start" 
        element={
          <AppLayout>
            <AuthStartPage />
          </AppLayout>
        } 
      />
      <Route 
        path="/auth/callback" 
        element={
          <AppLayout>
            <AuthCallbackPage />
          </AppLayout>
        } 
      />

      {/* Routes ที่ต้องล็อกอิน */}
      <Route
        path="/ments"
        element={
          <RequireAuth>
            <AppLayout>
              <MentListPage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/ments/new"
        element={
          <RequireAuth>
            <AppLayout>
              <MentEditorPage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/ments/:id"
        element={
          <RequireAuth>
            <AppLayout>
              <MentDetailPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      {/* 404 - Redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}