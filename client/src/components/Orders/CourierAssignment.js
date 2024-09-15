import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './CourierAssignment.css';

const CourierAssignment = ({
  isOpen,
  onClose,
  selectedOrders,
  onAssignCourier,
  businessId
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCouriers, setAvailableCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      fetchAvailableCouriers();
    }
  }, [isOpen, businessId]);

  const fetchAvailableCouriers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/business/${businessId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch couriers');
      }
      const data = await response.json();
      const filteredCouriers = data.filter(user => 
        user.profiles.messenger && 
        user.profiles.messenger.isCurrentlyOnShift && 
        user.profiles.messenger.isCurrentlyAvailable
      );
      setAvailableCouriers(filteredCouriers);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredCouriers = availableCouriers.filter(courier => 
    courier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = () => {
    onAssignCourier(selectedCourier);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{t('assign_courier')}</h2>
        {isLoading ? (
          <p>{t('loading')}</p>
        ) : error ? (
          <p>{t('error')}: {error}</p>
        ) : availableCouriers.length === 0 ? (
          <p>{t('no_available_couriers')}</p>
        ) : (
          <>
            <input
              type="text"
              className="courier-search"
              placeholder={t('search_couriers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              value={selectedCourier} 
              onChange={(e) => setSelectedCourier(e.target.value)}
              className="courier-dropdown"
            >
              <option value="">{t('select_courier')}</option>
              {filteredCouriers.map(courier => (
                <option key={courier.uid} value={courier.uid}>{courier.name}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button 
                onClick={handleAssign} 
                className="assign-button" 
                disabled={!selectedCourier || selectedOrders.length === 0}
              >
                {t('assign')} ({selectedOrders.length})
              </button>
              <button onClick={onClose} className="cancel-button">
                {t('cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourierAssignment;