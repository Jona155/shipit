import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Header.css';

const Header = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { businessId } = useParams();
  const isRTL = i18n.language === 'he';

  const isBusinessList = location.pathname === '/shipit/businesses';
  const isBusinessView = businessId && businessId !== 'businesses';

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  return (
    <header className={`app-header sticky ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="header-content">
        <h1 className="app-title">
          <Link to={isBusinessView ? `/shipit/${businessId}` : '/shipit/businesses'} className="home-link">
            {isBusinessView ? t('business_dashboard') : t('app_title')}
          </Link>
        </h1>
        <nav className="main-nav">
          <ul>
            {isBusinessView ? (
              <>
                <li><Link to={`/shipit/${businessId}/orders`}>{t('nav_orders')}</Link></li>
                <li><Link to={`/shipit/${businessId}/users`}>{t('nav_users')}</Link></li>
                <li><Link to={`/shipit/${businessId}/analytics`}>{t('nav_analytics')}</Link></li>
                <li><Link to={`/shipit/${businessId}/settings`}>{t('nav_settings')}</Link></li>
                <li><Link to="/shipit/businesses">{t('nav_back_to_businesses')}</Link></li>
              </>
            ) : (
              <li><Link to="/shipit/businesses">{t('nav_businesses')}</Link></li>
            )}
            <li><button onClick={handleLogout} className="logout-button">{t('logout')}</button></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;