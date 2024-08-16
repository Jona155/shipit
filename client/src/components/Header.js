import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Header.css';

const Header = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuToggle = () => {
    if (isMobile && !isHomePage) {
      navigate('/');
    }
  };

  const renderNavLinks = () => (
    <nav className="main-nav">
      <ul>
        <li><Link to="/orders">{t('nav_orders')}</Link></li>
        <li><Link to="/users">{t('nav_users')}</Link></li>
        <li><Link to="/analytics">{t('nav_analytics')}</Link></li>
        <li><Link to="/settings">{t('nav_settings')}</Link></li>
      </ul>
    </nav>
  );

  return (
    <header className={`app-header ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="header-content">
        {isMobile && !isHomePage && (
          <div className="header-left">
            <button className="menu-toggle" onClick={handleMenuToggle}>
              ☰
            </button>
          </div>
        )}
        <h1 className="app-title">
          <Link to="/" className="home-link">{t('app_title')}</Link>
        </h1>
        {!isMobile && renderNavLinks()}
      </div>
    </header>
  );
};

export default Header;