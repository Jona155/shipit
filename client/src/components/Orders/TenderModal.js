import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './CourierAssignment.css'; // Reuse existing modal styles

const TenderModal = ({ isOpen, onClose, orderId, businessId, onSendTender }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch connected vendors when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen, businessId]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // Clean up the API URL to ensure it's correct
      let apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      // Remove any trailing special characters
      apiBaseUrl = apiBaseUrl.replace(/[%\s]+$/, '');
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/api/connections/business/${businessId}`, {
        headers: { 'authToken': token }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching vendors: ${response.statusText}`);
      }
      
      const data = await response.json();
      setVendors(data);
      
      // Pre-select all vendors by default
      const vendorIds = data.map(vendor => vendor.vendor_id);
      setSelectedVendors(vendorIds);
      
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorToggle = (vendorId) => {
    setSelectedVendors(prev => {
      if (prev.includes(vendorId)) {
        return prev.filter(id => id !== vendorId);
      } else {
        return [...prev, vendorId];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedVendors.length === 0) return;
    
    onSendTender(orderId, selectedVendors);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay modern-modal">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{t('send_to_tender')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading-text">{t('loading_vendors')}</div>
          ) : error ? (
            <div className="error-text">{error}</div>
          ) : vendors.length === 0 ? (
            <div className="info-text">{t('no_connected_vendors')}</div>
          ) : (
            <>
              <p className="info-text">{t('select_vendors_for_tender')}</p>
              <div className="vendors-list">
                {vendors.map(vendor => (
                  <div key={vendor.vendor_id} className="vendor-item">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.vendor_id)}
                        onChange={() => handleVendorToggle(vendor.vendor_id)}
                      />
                      <span>{vendor.vendor_name || vendor.vendor_id}</span>
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button
            onClick={handleSubmit}
            className="primary-button"
            disabled={selectedVendors.length === 0 || loading}
          >
            {t('send_tender')}
          </button>
          <button onClick={onClose} className="secondary-button">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenderModal; 