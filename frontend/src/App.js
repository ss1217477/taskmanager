import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Trash from './pages/Trash';
import Projects from './pages/Projects';
import Settings from './pages/Settings';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  return !user ? children : <Navigate to="/dashboard" />;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14 } }} />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />

        <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><Layout><Tasks title="Tasks" /></Layout></PrivateRoute>} />
        <Route path="/completed" element={<PrivateRoute><Layout><Tasks filterStatus="Completed" title="Completed Tasks" /></Layout></PrivateRoute>} />
        <Route path="/in-progress" element={<PrivateRoute><Layout><Tasks filterStatus="In Progress" title="In Progress Tasks" /></Layout></PrivateRoute>} />
        <Route path="/todo" element={<PrivateRoute><Layout><Tasks filterStatus="Todo" title="Todo Tasks" /></Layout></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute><Layout><Projects /></Layout></PrivateRoute>} />
        <Route path="/team" element={<PrivateRoute><Layout><Team /></Layout></PrivateRoute>} />
        <Route path="/trash" element={<PrivateRoute><Layout><Trash /></Layout></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
