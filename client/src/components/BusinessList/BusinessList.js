import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthContext';
import Loader from '../Loader';
import './BusinessList.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isLoggedIn, logout } = useAuth();

  const isRTL = i18n.language === 'he';

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const fetchBusinesses = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/businesses`, {
          headers: { 'authToken': token }
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();
        setBusinesses(data);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        setError('Failed to load businesses: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [isLoggedIn, navigate, logout]);

  // Filter businesses by name, case-insensitive
  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoggedIn) {
    return null;
  }

  if (loading) return <Loader />;
  if (error) return <div>{error}</div>;

  return (
    <div className={`business-list ${isRTL ? 'rtl' : 'ltr'}`}>
      <h1>{t('business_list')}</h1>
      <input
        type="text"
        className="business-search"
        placeholder="Search by business name"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      {filteredBusinesses.length === 0 ? (
        <p>{t('no_businesses_found')}</p>
      ) : (
        <ul>
          {filteredBusinesses.map(business => (
            <li key={business._id}>
              <Link to={`/shipit/${business._id}`}>
                <h2>{business.name}</h2>
                <p>{business.address}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BusinessList;
