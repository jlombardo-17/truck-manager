import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Camiones from './pages/Camiones';
import CamionForm from './pages/CamionForm';
import CamionDetalle from './pages/CamionDetalle';
import Choferes from './pages/Choferes';
import ChoferForm from './pages/ChoferForm';
import ChoferDetalle from './pages/ChoferDetalle';
import Viajes from './pages/Viajes';
import ViajeForm from './pages/ViajeForm';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/camiones"
            element={
              <ProtectedRoute>
                <Camiones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/camiones/:id"
            element={
              <ProtectedRoute>
                <CamionDetalle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/camiones/new"
            element={
              <ProtectedRoute>
                <CamionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/camiones/edit/:id"
            element={
              <ProtectedRoute>
                <CamionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/choferes"
            element={
              <ProtectedRoute>
                <Choferes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/choferes/:id"
            element={
              <ProtectedRoute>
                <ChoferDetalle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/choferes/new"
            element={
              <ProtectedRoute>
                <ChoferForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/choferes/edit/:id"
            element={
              <ProtectedRoute>
                <ChoferForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viajes"
            element={
              <ProtectedRoute>
                <Viajes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viajes/nuevo"
            element={
              <ProtectedRoute>
                <ViajeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viajes/:id"
            element={
              <ProtectedRoute>
                <ViajeForm />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
