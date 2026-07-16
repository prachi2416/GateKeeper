import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Algorithms from './pages/Algorithms';
import Benchmarks from './pages/Benchmarks';
import Monitoring from './pages/Monitoring';
import GatewayInstances from './pages/GatewayInstances';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ApiKeys from './pages/ApiKeys';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/algorithms" element={<Algorithms />} />
            <Route path="/benchmarks" element={<Benchmarks />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/gateway" element={<GatewayInstances />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/api-keys" element={<ApiKeys />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
