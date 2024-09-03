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

  const isBusinessList = location.pathname === '/';
  const businessId = location.pathname.split('/')[1];
  const isBusinessView = businessId && businessId !== 'login';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuToggle = () => {
    if (isMobile) {
      if (isBusinessView) {
        navigate(`/${businessId}`);
      } else {
        navigate('/');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const renderNavLinks = () => (
    <nav className="main-nav">
      <ul>
        {isBusinessView ? (
          <>
            <li><Link to={`/${businessId}/orders`}>{t('nav_orders')}</Link></li>
            <li><Link to={`/${businessId}/users`}>{t('nav_users')}</Link></li>
            <li><Link to={`/${businessId}/analytics`}>{t('nav_analytics')}</Link></li>
            <li><Link to={`/${businessId}/settings`}>{t('nav_settings')}</Link></li>
            <li><Link to="/">{t('nav_back_to_businesses')}</Link></li>
          </>
        ) : (
          <li><Link to="/">{t('nav_businesses')}</Link></li>
        )}
        <li><button onClick={handleLogout} className="logout-button">{t('logout')}</button></li>
      </ul>
    </nav>
  );

  return (
    <header className={`app-header ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="header-content">
        {isMobile && !isBusinessList && (
          <div className="header-left">
            <button className="menu-toggle" onClick={handleMenuToggle}>
              ☰
            </button>
          </div>
        )}
        <h1 className="app-title">
          <Link to={isBusinessView ? `/${businessId}` : '/'} className="home-link">
            {isBusinessView ? t('business_dashboard') : t('app_title')}
          </Link>
        </h1>
        {!isMobile && renderNavLinks()}
      </div>
    </header>
  );
};

export default Header;