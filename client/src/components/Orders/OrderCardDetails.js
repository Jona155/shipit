import React from 'react';
import { useTranslation } from 'react-i18next';
import { Phone } from "lucide-react";

// Helper function to generate navigation URL
const navUrlFor = (addr) => {
  if (!addr || typeof addr !== 'string') return '#'; // Return a safe fallback
  const encoded = encodeURIComponent(addr);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isMobile
    ? `https://waze.com/ul?q=${encoded}&navigate=yes`
    : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
};

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

  // Get the phone number with fallbacks
  const phoneNumber = order.customer_phone_number || order.phone || order.customer_phone;
  const addressString = typeof order.address === 'string' ? order.address : renderAddress(order.address);

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
          <div className="detail-value">
            {phoneNumber ? (
              <div className="order-phone-line">
                {phoneNumber}
                <a
                  href={`tel:${phoneNumber}`}
                  className="phone-icon-link"
                  aria-label={t('call_customer')}
                >
                  <Phone className="phone-icon" />
                </a>
              </div>
            ) : (
              'N/A'
            )}
          </div>
        </div>
        
        <div className="order-detail">
          <div className="detail-label">{t('orders_address')}:</div>
          <div className="detail-value">
            {addressString ? (
              <div className="order-address-line">
                <a
                  href={navUrlFor(addressString)}
                  className="address-link"
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={t('navigate_to_address')}
                >
                  {addressString}
                </a>
              </div>
            ) : (
              'N/A'
            )}
          </div>
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