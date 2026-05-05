import React from 'react'; // Refreshed
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { isConfigured } from './firebase';
import Login from './components/Login';
import Signup from './components/Signup';
import StudentDashboard from './components/student/StudentDashboard';
import FaceRegistration from './components/student/FaceRegistration';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import SetupRequired from './components/SetupRequired';

function App() {
  if (!isConfigured) {
    return <SetupRequired />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100">
          <Toaster
            position="top-right"
            toastOptions={{ duration: 4000, style: { background: '#363636', color: '#fff' } }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/student"
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/register-face"
              element={
                <ProtectedRoute role="student">
                  <ErrorBoundary>
                    <FaceRegistration />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;





