import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Pages
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Receipts from './pages/Receipts';
import ReceiptDetail from './pages/ReceiptDetail';
import Deliveries from './pages/Deliveries';
import DeliveryDetail from './pages/DeliveryDetail';
import Transfers from './pages/Transfers';
import Adjustments from './pages/Adjustments';
import MoveHistory from './pages/MoveHistory';
import Warehouses from './pages/Warehouses';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1c1f22', color: '#e8eaed', border: '1px solid #2a2d31', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px' } }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="receipts/:id" element={<ReceiptDetail />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="deliveries/:id" element={<DeliveryDetail />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="adjustments" element={<Adjustments />} />
            <Route path="history" element={<MoveHistory />} />
            <Route path="warehouses" element={<Warehouses />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
