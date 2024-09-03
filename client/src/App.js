import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import Footer from './components/Footer';
import Orders from './components/Orders/Orders';
import Users from './components/Users/Users';
import Analytics from './components/Analytics/Analytics';
import Settings from './components/Settings/Settings';
import HomePage from './components/HomePage';
import BusinessList from './components/BusinessList/BusinessList';
import './App.css';

const App = () => {
  const { i18n } = useTranslation();

  return (
    <Router>
      <div className={`app ${i18n.language === 'he' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="app-main-content">
        <Routes>
            <Route path="/" element={<BusinessList />} />
            <Route path="/:businessId" element={<HomePage />} />
            <Route path="/:businessId/orders" element={<Orders />} />
            <Route path="/:businessId/users" element={<Users />} />
            <Route path="/:businessId/analytics" element={<Analytics />} />
            <Route path="/:businessId/settings" element={<Settings />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;