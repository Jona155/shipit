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
      const filtered = data.filter(
        user =>
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
    // Basic validations
    if (selectedOrders.length === 0) {
      alert(t('select_orders_and_courier'));
      return;
    }

    if (courierType === 'inhouse') {
      if (!selectedCourier) {
        alert(t('select_orders_and_courier'));
        return;
      }
      // Make sure the selected courier is in the list of available couriers
      const selectedCourierData = availableCouriers.find(
        courier => courier.uid === selectedCourier
      );
      if (!selectedCourierData) {
        console.error('Selected courier not found');
        return;
      }

      // -- NEW FLOW: POST to /api/delivery-group/assign --
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/delivery-group/assign`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courier_uid: selectedCourier,
              order_ids: selectedOrders
            })
          }
        );
        if (!response.ok) {
          throw new Error('Failed to assign courier');
        }
        const result = await response.json();

        // result.updated_orders => The updated orders with "ASSIGNED" status
        // result.delivery_group => The new delivery group document
        onAssignCourier(result.updated_orders);
        onClose();
      } catch (err) {
        console.error('Error assigning courier:', err);
        setError(err.message);
      }
    } else if (courierType === 'thirdparty') {
      // Existing logic for third-party assignments remains as-is
      if (!selectedVendor) {
        alert(t('select_orders_and_courier'));
        return;
      }
      const selectedVendorData = vendorConnections.find(
        conn => conn.vendor_id === selectedVendor
      );
      if (!selectedVendorData) {
        console.error('Selected vendor not found');
        return;
      }
      try {
        // We keep them in an "ACCEPTED" status until the vendor approves
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/orders/update-status`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_ids: selectedOrders,
              status: 'ACCEPTED',
              courier_id: selectedVendorData.vendor_id,
              courier_name: selectedVendorData.vendor_name,
              third_party: true
            })
          }
        );
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
                    <option key={courier.uid} value={courier.uid}>
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
                  <option value="">{t('select_courier_company')}</option>
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
