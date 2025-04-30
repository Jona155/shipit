import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './CourierAssignment.css';
import Loading from '../common/Loading';
import '../common/styles.css';

const CourierAssignment = ({
  isOpen,
  onClose,
  selectedOrders,
  onAssignCourier,
  businessId,
  showAlertMessage
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCouriers, setAvailableCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the in-house couriers from your users/business endpoint
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedCourier('');
      fetchAvailableCouriers();
    }
  }, [isOpen, businessId]);

  const fetchAvailableCouriers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/users/business/${businessId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch couriers');
      }
      const data = await response.json();
      
      const filtered = data.filter(
        user =>
          user.profiles?.messenger &&
          user.profiles.messenger.isCurrentlyOnShift &&
          user.profiles.messenger.isCurrentlyAvailable
      ).map(user => ({
        ...user,
        // Store both IDs to use the correct one later
        _id: user._id,        // user_businesses _id
        uid: user.uid         // users collection _id
      }));
      
      setAvailableCouriers(filtered);
    } catch (err) {
      console.error('Error fetching couriers:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredCouriers = availableCouriers.filter(courier =>
    courier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedCourier) {
      showAlertMessage(t('select_courier'), 'error');
      return;
    }

    try {
      // Find the selected courier object from available couriers
      const selectedCourierObj = availableCouriers.find(c => c._id === selectedCourier);
      
      if (!selectedCourierObj) {
        throw new Error('Selected courier not found in available couriers');
      }
      
      // Log the exact payload we're sending - now using delivery-group format
      // Use the uid (users collection _id) instead of the user_businesses _id
      const payload = {
        courier_uid: selectedCourierObj.uid,  // Use the uid which maps to users collection _id
        order_ids: selectedOrders,
        businessId: businessId // Add the businessId to the payload
      };
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/delivery-group/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Failed to assign orders: ${errorData.error}`);
      }

      const data = await response.json();
      // Pass the updated_orders from the response to maintain compatibility with parent component
      onAssignCourier(data.updated_orders);
      onClose();
    } catch (error) {
      console.error('Assignment error:', error);
      showAlertMessage(t('error_assigning_orders'), 'error');
    }
  };

  return (
    <div className="modal-overlay modern-modal">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{t('assign_courier')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {isLoading ? (
            <Loading size="small" />
          ) : error ? (
            <p className="error-text">{t('error')}: {error}</p>
          ) : availableCouriers.length === 0 ? (
            <p className="info-text">{t('no_available_couriers')}</p>
          ) : (
            <div className="inhouse-form">
              <input
                type="text"
                className="input-field courier-search"
                placeholder={t('search_users')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={selectedCourier}
                onChange={(e) => setSelectedCourier(e.target.value)}
                className="input-field courier-dropdown"
              >
                <option value="">{t('select_courier')}</option>
                {filteredCouriers.map(courier => (
                  <option key={courier._id} value={courier._id}>
                    {courier.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            onClick={handleAssign}
            className="primary-button"
            disabled={selectedOrders.length === 0 || !selectedCourier}
          >
            {t('assign')} ({selectedOrders.length})
          </button>
          <button onClick={onClose} className="secondary-button">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourierAssignment;
