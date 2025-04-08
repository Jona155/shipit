import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import './Header.css';

const Header = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { businessId } = useParams();
  const { logout } = useAuth();
  const isRTL = i18n.language === 'he';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isBusinessView = businessId && businessId !== 'businesses';

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`app-header ${isRTL ? 'rtl' : 'ltr'} ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <div className="header-logo">
          <h1 className="app-title">
            <Link
              to={isBusinessView ? `/shipit/${businessId}` : '/shipit/businesses'}
              className="home-link"
              onClick={closeMobileMenu}
            >
              {isBusinessView ? t('business_dashboard') : t('app_title')}
            </Link>
          </h1>
        </div>

        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`} 
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? t('collapse') : t('expand')}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <nav className={`main-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul>
            {isBusinessView ? (
              <>
                <li>
                  <Link 
                    to={`/shipit/${businessId}/orders`}
                    className={location.pathname.includes('/orders') ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    {t('nav_orders')}
                  </Link>
                </li>
                <li>
                  <Link 
                    to={`/shipit/${businessId}/users`}
                    className={location.pathname.includes('/users') ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    {t('nav_users')}
                  </Link>
                </li>
                <li>
                  <Link 
                    to={`/shipit/${businessId}/analytics`}
                    className={location.pathname.includes('/analytics') ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    {t('nav_analytics')}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/shipit/businesses"
                    className={location.pathname.includes('/businesses') && !isBusinessView ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    {t('nav_my_businesses')}
                  </Link>
                </li>
                <li>
                  <Link 
                    to={`/shipit/${businessId}/settings`}
                    className={location.pathname.includes('/settings') ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    {t('nav_settings')}
                  </Link>
                </li>
                <li className="logout-item">
                  <button onClick={handleLogout} className="logout-button">
                    {t('logout')}
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link 
                  to="/shipit/businesses"
                  className={location.pathname.includes('/businesses') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  {t('nav_my_businesses')}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
