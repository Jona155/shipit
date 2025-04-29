import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './TenderModal.css'; // Reuse existing modal styles

const TenderStatusModal = ({ 
  isOpen, 
  onClose, 
  orderId, 
  orderDetails,
  businessId 
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he'; // Check if current language is Hebrew
  const [tenderData, setTenderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [confirming, setConfirming] = useState(false);

  // Fetch tender status data
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchTenderStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use the orderDetails passed in from the parent component if available
        if (orderDetails && orderDetails.tender_scope) {
          console.log("Using cached order details:", orderDetails);
          
          // Use tender_bid (which will be renamed to vendor_bid) as the vendor identifier
          const normalizedTenderScope = orderDetails.tender_scope.map(v => ({
            ...v,
            // Normalize by ensuring we preserve the original field and also make it accessible via a consistent name
            tender_bid: v.tender_bid || v.vendor_bid || '',
            vendor_bid: v.tender_bid || v.vendor_bid || ''
          }));
          
          setTenderData({
            ...orderDetails,
            tender_scope: normalizedTenderScope,
            selected_vendor: orderDetails.selected_vendor || null
          });
          
          // If there's already a selected vendor, preselect it
          if (orderDetails.selected_vendor) {
            console.log("Preselecting vendor from selected_vendor:", orderDetails.selected_vendor);
            setSelectedVendor(orderDetails.selected_vendor);
          } else if (
            // If only one vendor has approved, preselect it
            orderDetails.tender_scope && 
            orderDetails.tender_scope.filter(v => v.status === 'APPROVED').length === 1
          ) {
            const approvedVendor = orderDetails.tender_scope.find(v => v.status === 'APPROVED');
            console.log("Found approved vendor:", approvedVendor);
            const vendorBid = approvedVendor.tender_bid || approvedVendor.vendor_bid || '';
            console.log("Preselecting vendor bid:", vendorBid);
            setSelectedVendor(vendorBid);
          }
          
          setLoading(false);
          return;
        }
        
        // Otherwise fetch the data from the API
        const apiBaseUrl = process.env.REACT_APP_API_URL || '';
        // Using the business/order endpoint instead of direct order endpoint
        const response = await fetch(
          `${apiBaseUrl}/api/orders/business/${businessId}?order_id=${orderId}`,
          {
            headers: { 
              'Content-Type': 'application/json',
              'authToken': localStorage.getItem('authToken')
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch tender status');
        }

        const data = await response.json();
        console.log("Fetched order data:", data);
        
        // The API might return an array of orders or a single order
        const orderData = Array.isArray(data) ? data.find(o => o._id === orderId) : data;
        
        if (!orderData) {
          throw new Error('Order not found');
        }
        
        // Normalize the tender_scope data
        if (orderData.tender_scope) {
          orderData.tender_scope = orderData.tender_scope.map(v => ({
            ...v,
            // Normalize by ensuring we have both field names available
            tender_bid: v.tender_bid || v.vendor_bid || '',
            vendor_bid: v.tender_bid || v.vendor_bid || ''
          }));
        }

        console.log("Normalized order data:", orderData);
        setTenderData(orderData);
        
        // If there's already a selected vendor, preselect it
        if (orderData.selected_vendor) {
          setSelectedVendor(orderData.selected_vendor);
        } else if (
          // If only one vendor has approved, preselect it
          orderData.tender_scope && 
          orderData.tender_scope.filter(v => v.status === 'APPROVED').length === 1
        ) {
          const approvedVendor = orderData.tender_scope.find(v => v.status === 'APPROVED');
          console.log("Found approved vendor:", approvedVendor);
          const vendorBid = approvedVendor.tender_bid || approvedVendor.vendor_bid || '';
          setSelectedVendor(vendorBid);
          console.log("Set selected vendor to:", vendorBid);
        }
      } catch (err) {
        console.error('Error fetching tender status:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTenderStatus();
    
    // Setup polling for real-time updates
    const interval = setInterval(fetchTenderStatus, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [isOpen, orderId, orderDetails, businessId]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedVendor(null);
      setError(null);
      setConfirming(false);
    }
  }, [isOpen]);

  // Handle confirmation of winner selection
  const handleConfirmWinner = async () => {
    if (!selectedVendor || confirming) return;
    
    console.log("Starting confirmation with vendor bid:", selectedVendor);
    setConfirming(true);
    setError(null);
    
    try {
      const apiBaseUrl = process.env.REACT_APP_API_URL || '';
      const token = localStorage.getItem('authToken');
      
      // Log request details for debugging
      console.log("Sending select-vendor request:", {
        url: `${apiBaseUrl}/api/orders/select-vendor`,
        orderId,
        selectedVendor
      });
      
      // Use the proper API endpoint with the correct method (POST)
      const response = await fetch(
        `${apiBaseUrl}/api/orders/select-vendor`,
        {
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json',
            'authToken': token
          },
          body: JSON.stringify({
            order_id: orderId,
            selected_vendor: selectedVendor
          })
        }
      );

      // Show detailed error information
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorMsg = 'Failed to select tender winner';
        try {
          // Try to parse error message from JSON
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.error) {
            errorMsg = errorData.error;
          }
        } catch (e) {
          // If parsing fails, use the raw text if it's not too long
          if (errorText && errorText.length < 100) {
            errorMsg = errorText;
          }
        }
        
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log("API success response:", result);
      
      // Show success message
      setError(null);
      onClose(true); // Close with refresh flag
    } catch (err) {
      console.error('Error confirming tender winner:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setConfirming(false);
    }
  };

  // Generate a timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  // Extract vendors with status from tender data
  const vendors = tenderData?.tender_scope || [];
  const hasApprovedVendors = vendors.some(v => v.status === 'APPROVED');
  const allDisapproved = vendors.length > 0 && vendors.every(v => v.status === 'DISAPPROVED');
  const readOnly = !!tenderData?.selected_vendor;

  return (
    <div className="modal-overlay">
      <div className={`modal-content tender-status-modal ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="modal-header">
          <h2>{t('tender_status_title')}</h2>
          <button className="close-button" onClick={() => onClose(false)}>×</button>
        </div>

        <div className={`modal-body ${isRTL ? 'rtl' : 'ltr'}`}>
          {/* Order details summary */}
          <div className="order-summary">
            <p><strong>{t('order_id')}:</strong> {orderDetails?.short_id || orderId}</p>
            <p><strong>{t('orders_customer')}:</strong> {orderDetails?.customer_name}</p>
            <p><strong>{t('orders_address')}:</strong> {orderDetails?.address}</p>
          </div>

          {loading ? (
            <div className="loading-spinner">{t('loading_vendors')}</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : vendors.length === 0 ? (
            <p className="no-data-message">{t('no_tender_responses')}</p>
          ) : (
            <>
              <div className="vendor-table-container">
                <table className={`vendor-table ${isRTL ? 'rtl' : 'ltr'}`}>
                  <thead>
                    <tr>
                      <th>{t('vendor_name')}</th>
                      <th>{t('status')}</th>
                      <th>{t('response_time')}</th>
                      {hasApprovedVendors && !readOnly && (
                        <th>{t('select_winner')}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.sort((a, b) => (a.vendor_bid || a.tender_bid || '').localeCompare(b.vendor_bid || b.tender_bid || '')).map((vendor) => {
                      const isApproved = vendor.status === 'APPROVED';
                      const isDisapproved = vendor.status === 'DISAPPROVED';
                      const isPending = vendor.status === 'PENDING' || !vendor.status;
                      const isSelected = tenderData?.selected_vendor === (vendor.vendor_bid || vendor.tender_bid);
                      
                      const statusKey = vendor.status?.toLowerCase() || 'pending';
                      const statusText = t(statusKey); // Translate all statuses
                      
                      return (
                        <tr 
                          key={vendor.vendor_bid || vendor.tender_bid || Math.random().toString()} 
                          className={`
                            vendor-row 
                            ${isApproved ? 'approved' : ''}
                            ${isDisapproved ? 'disapproved' : ''}
                            ${isPending ? 'pending' : ''}
                            ${isSelected ? 'selected' : ''}
                          `}
                        >
                          <td>{vendor.vendor_bid || vendor.tender_bid || 'Unknown'}</td>
                          <td>
                            <span 
                              className={`status-badge ${statusKey}`}
                              aria-label={`${t('status')}: ${statusText}`}
                            >
                              {isApproved && '✓ '}
                              {isDisapproved && '✕ '}
                              {statusText} {/* Display translated status */}
                            </span>
                          </td>
                          <td>{formatTime(vendor.response_time)}</td>
                          {hasApprovedVendors && !readOnly && (
                            <td>
                              <input 
                                type="radio" 
                                name="selected-vendor"
                                value={vendor.vendor_bid || vendor.tender_bid || ''}
                                checked={selectedVendor === (vendor.vendor_bid || vendor.tender_bid)}
                                onChange={() => {
                                  const vendorBid = vendor.vendor_bid || vendor.tender_bid || '';
                                  console.log("Selecting vendor:", vendorBid, "Previous:", selectedVendor);
                                  setSelectedVendor(vendorBid);
                                }}
                                disabled={!isApproved}
                                title={!isApproved ? t('vendor_must_approve') : ''}
                                aria-label={`${t('select')} ${vendor.vendor_bid || vendor.tender_bid}`}
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {tenderData?.selected_vendor && (
                <div className="winner-info">
                  <p>
                    <strong>{t('selected_winner')}:</strong> {
                      vendors.find(v => (v.vendor_bid || v.tender_bid) === tenderData.selected_vendor)?.vendor_bid || 
                      vendors.find(v => (v.vendor_bid || v.tender_bid) === tenderData.selected_vendor)?.tender_bid || 
                      tenderData.selected_vendor
                    }
                  </p>
                </div>
              )}
              
              {allDisapproved && !readOnly && (
                <div className="all-disapproved-message">
                  <p>{t('all_vendors_declined')}</p>
                  <button 
                    className="action-button cancel-tender-button"
                    onClick={() => onClose(true)}
                  >
                    {t('return_to_assign_manually')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          {!readOnly && (
            <button
              className="confirm-button"
              disabled={!selectedVendor || confirming}
              onClick={() => {
                console.log("Confirming winner:", selectedVendor);
                handleConfirmWinner();
              }}
            >
              {confirming ? t('confirming') : t('confirm_winner')}
            </button>
          )}
          <button className="cancel-button" onClick={() => onClose(false)}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenderStatusModal; 