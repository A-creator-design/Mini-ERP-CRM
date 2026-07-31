import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetail from './pages/Customers/CustomerDetail';
import ProductList from './pages/Products/ProductList';
import ChallanList from './pages/Challans/ChallanList';
import ChallanCreate from './pages/Challans/ChallanCreate';
import ChallanDetail from './pages/Challans/ChallanDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />

      <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />

      <Route path="/challans" element={<ProtectedRoute><ChallanList /></ProtectedRoute>} />
      <Route path="/challans/new" element={<ProtectedRoute roles={['ADMIN', 'SALES']}><ChallanCreate /></ProtectedRoute>} />
      <Route path="/challans/:id" element={<ProtectedRoute><ChallanDetail /></ProtectedRoute>} />

      <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}
