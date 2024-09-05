import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './BusinessList.css';



const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();



  const isRTL = i18n.language === 'he';

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/businesses`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        setBusinesses(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching businesses:', error);
        setError('Failed to load businesses: ' + error.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>{t('loading')}</div>;
  if (error) return <div>{error}</div>;

  return (
      <div className={`business-list ${isRTL ? 'rtl' : 'ltr'}`}>
      <h1>{t('business_list')}</h1>
      {businesses.length === 0 ? (
        <p>{t('no_businesses_found')}</p>
      ) : (
        <ul>
          {businesses.map(business => (
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