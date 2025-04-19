import React from 'react';
import { HashRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login/Login';
import ProtectedRoute from './ProtectedRoute';
import BusinessList from './BusinessList/BusinessList';
import BusinessRouter from './BusinessRouter';
import Footer from './Footer';
import Header from './Header';
import Loader from './Loader';

const Layout = () => (
  <div className="app-layout">
    <Header />
    <main className="app-main">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const RootRouterContent = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/shipit/businesses" replace /> : <Login />} />
      <Route path="/shipit" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="businesses" replace />} />
        <Route path="businesses" element={<BusinessList />} />
        <Route path=":businessId/*" element={<BusinessRouter />} />
      </Route>
      <Route path="/" element={<Navigate to={isLoggedIn ? "/shipit/businesses" : "/login"} replace />} />
      <Route path="*" element={
        <div>
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href={isLoggedIn ? "/shipit/businesses" : "/login"}>Go back to home</a>
        </div>
      } />
    </Routes>
  );
};

const RootRouter = () => {
  return (
    <AuthProvider>
      <Router>
        <RootRouterContent />
      </Router>
    </AuthProvider>
  );
};

export default RootRouter;