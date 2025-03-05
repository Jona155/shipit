// CourierAssignment.js
// Updated to fix the tab reset issue.
// Now, when the modal opens, form fields are reset (defaulting to "inhouse").
// A separate useEffect watches for changes to courierType so that vendor connections are fetched
// only when the user selects the "thirdparty" tab.

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
  // New state for vendor connections (third-party couriers)
  const [vendorConnections, setVendorConnections] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [courierType, setCourierType] = useState('inhouse'); // 'inhouse' or 'thirdparty'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // This useEffect runs only when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form fields when the modal opens
      setSearchTerm('');
      setSelectedCourier('');
      setSelectedVendor('');
      setCourierType('inhouse'); // default only when modal opens
      fetchAvailableCouriers();
    }
  }, [isOpen, businessId]);

  // Separate useEffect to fetch vendor connections when courierType becomes thirdparty
  useEffect(() => {
    if (courierType === 'thirdparty') {
      fetchVendorConnections();
    }
  }, [courierType]);

  const fetchAvailableCouriers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/business/${businessId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch couriers');
      }
      const data = await response.json();
      const filtered = data.filter(user =>
        user.profiles.messenger &&
        user.profiles.messenger.isCurrentlyOnShift &&
        user.profiles.messenger.isCurrentlyAvailable
      );
      setAvailableCouriers(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendorConnections = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/connections/business/${businessId}`);
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
    if (selectedOrders.length === 0) {
      alert(t('select_orders_and_courier'));
      return;
    }

    if (courierType === 'inhouse') {
      if (!selectedCourier) {
        alert(t('select_orders_and_courier'));
        return;
      }
      const selectedCourierData = availableCouriers.find(courier => courier.uid === selectedCourier);
      if (!selectedCourierData) {
        console.error('Selected courier not found');
        return;
      }
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/update-status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_ids: selectedOrders,
            status: 'ASSIGNED',
            courier_id: selectedCourier,
            courier_name: selectedCourierData.name,
            third_party: false
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to assign courier');
        }
        const result = await response.json();
        onAssignCourier(result.updated_orders);
        onClose();
      } catch (err) {
        console.error('Error assigning courier:', err);
        setError(err.message);
      }
    } else if (courierType === 'thirdparty') {
      if (!selectedVendor) {
        alert(t('select_orders_and_courier'));
        return;
      }
      const selectedVendorData = vendorConnections.find(conn => conn.vendor_id === selectedVendor);
      if (!selectedVendorData) {
        console.error('Selected vendor not found');
        return;
      }
      try {
        // For third party, keep status as "ACCEPTED" until the vendor approves
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/update-status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_ids: selectedOrders,
            status: 'ACCEPTED',
            courier_id: selectedVendorData.vendor_id,
            courier_name: selectedVendorData.vendor_name,
            third_party: true
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to assign third party courier');
        }
        const result = await response.json();
        onAssignCourier(result.updated_orders);
        onClose();
      } catch (err) {
        console.error('Error assigning third party courier:', err);
        setError(err.message);
      }
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
              {t('use_inhouse_courier')}
            </button>
            <button
              className={`tab-button ${courierType === 'thirdparty' ? 'active' : ''}`}
              onClick={() => setCourierType('thirdparty')}
            >
              {t('use_third_party')}
            </button>
          </div>
          {courierType === 'inhouse' ? (
            isLoading ? (
              <p className="loading-text">{t('loading')}</p>
            ) : error ? (
              <p className="error-text">{t('error')}: {error}</p>
            ) : availableCouriers.length === 0 ? (
              <p className="info-text">{t('no_available_couriers')}</p>
            ) : (
              <div className="inhouse-form">
                <input
                  type="text"
                  className="input-field courier-search"
                  placeholder={t('search_couriers')}
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
                    <option key={courier.uid} value={courier.uid}>{courier.name}</option>
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
                  <option value="">{t('select_courier_company')}</option>
                  {vendorConnections.map(conn => (
                    <option key={conn._id} value={conn.vendor_id}>{conn.vendor_name}</option>
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
          <button onClick={onClose} className="secondary-button">{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
};

export default CourierAssignment;
