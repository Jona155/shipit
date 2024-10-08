import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, Users, BarChart, Settings } from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const { businessId } = useParams();

  const navItems = [
    { text: t('nav_orders'), icon: Package, path: `orders` },
    { text: t('nav_users'), icon: Users, path: `users` },
    { text: t('nav_analytics'), icon: BarChart, path: `analytics` },
    { text: t('nav_settings'), icon: Settings, path: `settings` },
  ];

  return (
    <div className={`home-page ${isRTL ? 'rtl' : 'ltr'}`}>
      <main className="main-content">
        <div className="nav-grid">
          {navItems.map((item, index) => (
            <Link key={index} to={item.path} className="nav-item">
              <item.icon className="nav-icon" />
              <span className="nav-text">{item.text}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;