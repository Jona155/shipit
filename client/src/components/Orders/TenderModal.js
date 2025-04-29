import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './TenderModal.css';

const TenderModal = ({ isOpen, onClose, orderId, businessId, onSendTender }) => {
  const { t } = useTranslation();
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch available vendors when the modal opens
  useEffect(() => {
    if (!isOpen || !businessId) return;

    const fetchVendors = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiBaseUrl = process.env.REACT_APP_API_URL || '';
        const token = localStorage.getItem('authToken');
        
        console.log("Fetching vendors from:", `${apiBaseUrl}/api/businesses/vendors?business_id=${businessId}`);
        console.log("Auth token present:", !!token);
        
        const response = await fetch(
          `${apiBaseUrl}/api/businesses/vendors?business_id=${businessId}`,
          {
            headers: { 
              'Content-Type': 'application/json',
              'authToken': token 
            }
          }
        );

        console.log("Vendors API response status:", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Vendor API error details:", {
            status: response.status,
            statusText: response.statusText,
            text: errorText
          });
          throw new Error('Failed to fetch vendors');
        }

        const data = await response.json();
        console.log("Vendors fetched successfully:", data);
        
        setVendors(data);
        
        // Pre-select all vendors by default
        setSelectedVendors(data.map(vendor => vendor._id));
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [isOpen, businessId]);

  // Handle checkbox change
  const handleVendorSelection = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  // Handle submit - send order to selected vendors
  const handleSubmit = async () => {
    if (selectedVendors.length === 0) return;
    
    setSubmitting(true);
    try {
      await onSendTender(orderId, selectedVendors);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{t('send_to_tender')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p>{t('select_vendors_for_tender')}</p>
          
          {loading ? (
            <div className="loading-spinner">{t('loading_vendors')}</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : vendors.length === 0 ? (
            <p>{t('no_connected_vendors')}</p>
          ) : (
            <div className="vendors-list">
              {vendors.map(vendor => (
                <div key={vendor._id} className="vendor-checkbox">
                  <input
                    type="checkbox"
                    id={`vendor-${vendor._id}`}
                    checked={selectedVendors.includes(vendor._id)}
                    onChange={() => handleVendorSelection(vendor._id)}
                  />
                  <label htmlFor={`vendor-${vendor._id}`}>
                    {vendor.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            disabled={selectedVendors.length === 0 || submitting}
            className="confirm-button"
            onClick={handleSubmit}
          >
            {submitting ? t('sending') : t('send_to_tender')}
          </button>
          <button className="cancel-button" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenderModal; 