import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './BusinessList.css';

const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/businesses')
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`Network response was not ok: ${text}`);
          });
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
    <div className="business-list">
      <h1>{t('business_list')}</h1>
      {businesses.length === 0 ? (
        <p>{t('no_businesses_found')}</p>
      ) : (
        <ul>
          {businesses.map(business => (
            <li key={business._id}>
              <Link to={`/${business._id}`}>
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