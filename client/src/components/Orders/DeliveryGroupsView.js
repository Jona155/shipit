import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DeliveryGroupCard from './DeliveryGroupCard';
import './DeliveryGroupsView.css';

const DeliveryGroupsView = ({
  businessId,
  orders,
  onFinishDeliveryGroup,
  searchTerm,
  isRTL
}) => {
  const { t } = useTranslation();
  const [deliveryGroups, setDeliveryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeliveryGroups = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/delivery-group/assigned?bid=${businessId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch delivery groups');
        }
        
        const data = await response.json();
        setDeliveryGroups(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching delivery groups:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryGroups();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchDeliveryGroups, 30000);
    
    return () => clearInterval(intervalId);
  }, [businessId]);

  // Filter delivery groups based on search term
  const filteredGroups = deliveryGroups.filter(group => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check if courier name matches
    if (group.courier_name && group.courier_name.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Check if any order ID in the route matches
    return group.route.some(item => item.orderId.toLowerCase().includes(searchLower));
  });

  if (loading) return <div className="loading-message">{t('loading')}</div>;
  if (error) return <div className="error-message">{t('error')}: {error}</div>;

  return (
    <div className={`delivery-groups-container ${isRTL ? 'rtl' : 'ltr'}`}>
      {filteredGroups.length === 0 ? (
        <div className="no-groups-message">
          {searchTerm 
            ? t('no_delivery_groups_found_for_search', { search: searchTerm }) 
            : t('no_active_delivery_groups')}
        </div>
      ) : (
        <div className="delivery-groups-list">
          {filteredGroups.map(group => (
            <DeliveryGroupCard
              key={group._id}
              deliveryGroup={group}
              onFinishDeliveryGroup={onFinishDeliveryGroup}
              isRTL={isRTL}
              orders={orders}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryGroupsView; 