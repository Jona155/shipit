import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Header.css';

const Header = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={`app-header ${isRTL ? 'rtl' : ''}`}>
      <div className="header-content">
        <h1 className="app-title">
          <Link to="/" className="home-link">{t('app_title')}</Link>
        </h1>
        <nav className={`main-nav ${isMenuOpen ? 'active' : ''}`}>
          <ul>
            <li><Link to="/orders" onClick={toggleMenu}>{t('nav_orders')}</Link></li>
            <li><Link to="/users" onClick={toggleMenu}>{t('nav_users')}</Link></li>
            <li><Link to="/analytics" onClick={toggleMenu}>{t('nav_analytics')}</Link></li>
            <li><Link to="/settings" onClick={toggleMenu}>{t('nav_settings')}</Link></li>
          </ul>
        </nav>
        <button className="menu-toggle" onClick={toggleMenu}>
          ☰
        </button>
      </div>
    </header>
  );
};

export default Header;