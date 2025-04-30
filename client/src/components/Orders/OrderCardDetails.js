import React from 'react';
import { useTranslation } from 'react-i18next';

// This component renders the common details shared between OrderCard and VendorOrderCard
const OrderCardDetails = ({ order, isRTL, businessType }) => {
  const { t } = useTranslation();

  // Helper to safely render address
  const renderAddress = (address) => {
    if (!address) return null;
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      // Adjust based on your actual address object structure if different
      return `${address.street || ''}, ${address.city || ''}`; 
    }
    return t('address_not_available', 'Address not available'); // Add translation key if needed
  };

  return (
    <>
      {/* Content section - details common to both views */}
      <div className="order-card-content">
        {/* Source Business - only show for vendors */}
        {businessType === 'vendor' && (
          <div className="order-source">
            {t('source_business')}: {order.source_bid || order.bid}
          </div>
        )}
        
        <div className="order-detail">
          <div className="detail-label">{t('orders_customer')}:</div>
          <div className="detail-value">{order.customer_name || 'N/A'}</div>
        </div>
        
        <div className="order-detail">
          <div className="detail-label">{t('orders_phone_number')}:</div>
          <div className="detail-value">{order.customer_phone_number || 'N/A'}</div>
        </div>
        
        <div className="order-detail">
          <div className="detail-label">{t('orders_address')}:</div>
          <div className="detail-value">{renderAddress(order.address) || 'N/A'}</div>
        </div>
        
        <div className="order-detail">
          <div className="detail-label">{t('orders_items')}:</div>
          {/* Use pre-wrap to respect newlines in comments */}
          <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}> 
            {order.comments_for_order || 'N/A'}
          </div>
        </div>
        
        {/* Conditionally display courier info if available - might be relevant later */}
        {/* Consider if this should be moved to the specific cards if visibility differs */}
        {(order.courier_name || order.courier_id) && (
          <div className="order-detail">
            <div className="detail-label">{t('orders_courier')}:</div>
            <div className="detail-value">
              {order.courier_name || order.courier_id}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderCardDetails; 