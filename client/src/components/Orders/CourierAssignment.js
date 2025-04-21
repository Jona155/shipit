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
  // We keep the vendor connections logic for third-party assignments
  const [vendorConnections, setVendorConnections] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [courierType, setCourierType] = useState('inhouse');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the in-house couriers from your users/business endpoint
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedCourier('');
      setSelectedVendor('');
      setCourierType('inhouse'); // default tab
      fetchAvailableCouriers();
    }
  }, [isOpen, businessId]);

  // Fetch vendor connections if the user chooses third-party tab
  useEffect(() => {
    if (courierType === 'thirdparty') {
      fetchVendorConnections();
    }
  }, [courierType]);

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
      
      console.log('All users fetched:', data.length);
      console.log('First few users:', data.slice(0, 3).map(u => ({ 
        _id: u._id,  // This is the user_businesses _id
        uid: u.uid,  // This is the users collection _id we need
        name: u.name,
        onShift: u.profiles?.messenger?.isCurrentlyOnShift,
        available: u.profiles?.messenger?.isCurrentlyAvailable
      })));
      
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
      
      console.log('Filtered available couriers:', filtered.length);
      console.log('Available couriers:', filtered.map(u => ({ 
        _id: u._id,
        uid: u.uid,
        name: u.name
      })));
      
      setAvailableCouriers(filtered);
    } catch (err) {
      console.error('Error fetching couriers:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendorConnections = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/connections/business/${businessId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch vendor connections');
      }
      const data = await response.json();
      setVendorConnections(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  if (!isOpen) return null;

  const filteredCouriers = availableCouriers.filter(courier =>
    courier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async () => {
    if (courierType === 'inhouse' && !selectedCourier) {
      showAlertMessage(t('select_courier'), 'error');
      return;
    }

    try {
      // Very detailed logging for debugging
      console.log('===== DEBUGGING COURIER ASSIGNMENT =====');
      console.log('Selected courier ID:', selectedCourier);
      console.log('Available couriers:', availableCouriers);
      console.log('Selected orders:', selectedOrders);
      
      // Find the selected courier object from available couriers
      const selectedCourierObj = availableCouriers.find(c => c._id === selectedCourier);
      console.log('Selected courier object:', selectedCourierObj);
      
      if (!selectedCourierObj) {
        throw new Error('Selected courier not found in available couriers');
      }
      
      // Log the exact payload we're sending - now using delivery-group format
      // Use the uid (users collection _id) instead of the user_businesses _id
      const payload = {
        courier_uid: selectedCourierObj.uid,  // Use the uid which maps to users collection _id
        order_ids: selectedOrders
      };
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/delivery-group/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }
        throw new Error(`Failed to assign orders: ${errorData.error || response.statusText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Assignment succeeded:', data);
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
          <div className="courier-tab-selector">
            <button
              className={`tab-button ${courierType === 'inhouse' ? 'active' : ''}`}
              onClick={() => setCourierType('inhouse')}
            >
              {t('courier')}
            </button>
            <button
              className={`tab-button ${courierType === 'thirdparty' ? 'active' : ''}`}
              onClick={() => setCourierType('thirdparty')}
            >
              {t('dispatcher')}
            </button>
          </div>

          {courierType === 'inhouse' ? (
            isLoading ? (
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
            )
          ) : (
            <div className="thirdparty-form">
              {vendorConnections.length === 0 ? (
                <p className="info-text">{t('no_vendor_connections')}</p>
              ) : (
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="input-field courier-dropdown"
                >
                  <option value="">{t('select_courier')}</option>
                  {vendorConnections.map(conn => (
                    <option key={conn._id} value={conn.vendor_id}>
                      {conn.vendor_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            onClick={handleAssign}
            className="primary-button"
            disabled={
              selectedOrders.length === 0 ||
              (courierType === 'inhouse' ? !selectedCourier : !selectedVendor)
            }
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
