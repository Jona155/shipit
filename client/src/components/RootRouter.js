import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import Login from './Login/Login';
import ProtectedRoute from './ProtectedRoute';
import BusinessList from './BusinessList/BusinessList';
import BusinessRouter from './BusinessRouter';
import Footer from './Footer'
import Header from './Header';

const Layout = () => (
  <div className="app-layout">
    <Header />
    <main className="app-main">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const RootRouter = () => {
  const isLoggedIn = !!localStorage.getItem('isLoggedIn');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/shipit/businesses" replace /> : <Login />} />
        <Route path="/shipit" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="businesses" replace />} />
          <Route path="businesses" element={<BusinessList />} />
          <Route path=":businessId/*" element={<BusinessRouter />} />
        </Route>
        <Route path="*" element={<Navigate to={isLoggedIn ? "/shipit/businesses" : "/login"} replace />} />
      </Routes>
    </Router>
  );
};

export default RootRouter;