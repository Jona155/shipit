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
        setLoading(true);
        const response = await fetch(`/api/businesses/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
        console.log("Raw businesses data from API:", data);
        
        if (Array.isArray(data)) {
          setBusinesses(data);
        } else {
          console.error("API did not return an array for businesses:", data);
          setBusinesses([]);
          setError("Received invalid data format from server.");
        }
        
      } catch (error) {
        console.error('Error fetching businesses:', error);
        setError('Failed to load businesses: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [isLoggedIn, navigate, logout]);

  // Filter businesses safely
  const filteredBusinesses = businesses.filter(business => {
    const nameExists = business && typeof business.name === 'string';
    if (!nameExists) {
      console.warn('Skipping business due to missing or invalid name:', business);
      return false;
    }
    return business.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  console.log("Filtered businesses before render:", filteredBusinesses);

  const handleBusinessClick = (business) => {
    // Save business_type and sla to localStorage
    localStorage.setItem('currentBusinessType', business.business_type || ''); // Store empty string if undefined
    localStorage.setItem('currentBusinessSLA', business.sla || ''); // Store empty string if undefined
  };

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
          {filteredBusinesses.map(business => {
            if (!business || !business._id) {
              console.warn('Skipping rendering business due to missing object or _id:', business);
              return null;
            }
            
            return (
              <li key={business._id}>
                <Link to={`/shipit/${business._id}`} onClick={() => handleBusinessClick(business)}>
                  <h2>{business.name ? business.name : 'Unnamed Business'}</h2>
                  {business.address && (
                    <p>
                      {typeof business.address === 'string' 
                        ? business.address 
                        : typeof business.address === 'object' 
                          ? `${business.address.street || ''}, ${business.address.city || ''}`
                          : 'Address not available'
                      }
                    </p>
                  )}
                  {business.business_type && <p><strong>Type:</strong> {typeof business.business_type === 'string' ? business.business_type : 'Invalid Type'}</p>}
                  {business.sla && <p><strong>SLA:</strong> {typeof business.sla === 'number' || typeof business.sla === 'string' ? business.sla : 'Invalid SLA'}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BusinessList;
