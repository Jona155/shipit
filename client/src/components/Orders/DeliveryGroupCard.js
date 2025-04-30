import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './DeliveryGroupCard.css';

// Check if we're in development environment
const isDev = process.env.NODE_ENV === 'development';

const DeliveryGroupCard = ({
  deliveryGroup,
  onFinishDeliveryGroup,
  onAbortDeliveryGroup,
  isRTL,
  orders,
  businessType,
  businessId
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Find full order objects for each order in the route
  const routeOrders = deliveryGroup.route.map(routeItem => {
    const fullOrder = orders.find(order => order._id === routeItem.orderId);
    return fullOrder || { _id: routeItem.orderId, missing: true };
  });

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Check if we should show the vendor name (for restaurants viewing vendor-created groups)
  const vendorName = deliveryGroup.bid;
  
  // Show vendor name when the delivery group was created by a different business
  // If businessType is empty, assume restaurant (the most common case)
  // Otherwise check if it's explicitly a restaurant or source business
  const isRestaurant = !businessType || businessType === '' || businessType === 'restaurant' || businessType === 'source';
  const isExternalDelivery = vendorName !== businessId;
  const showVendor = isRestaurant && isExternalDelivery;
  
  // Determine if the current business can abort this delivery group
  // Only the business that owns the delivery group can abort it
  const canAbortGroup = deliveryGroup.bid === businessId;
  
  // Log values for debugging
  useEffect(() => {
    console.log('DeliveryGroupCard details:', {
      deliveryGroupBid: deliveryGroup.bid,
      businessId,
      businessType,
      businessTypeEmpty: !businessType || businessType === '',
      isRestaurant,
      isExternalDelivery,
      showVendor,
      canAbortGroup
    });
  }, [deliveryGroup.bid, businessId, businessType, isRestaurant, isExternalDelivery, showVendor, canAbortGroup]);

  // Helper function to toggle debug info display
  const toggleDebugInfo = () => {
    setShowDebug(!showDebug);
  };

  return (
    <div className={`delivery-group-card ${isRTL ? 'rtl' : 'ltr'}`}>
      {isDev && (
        <div className="debug-button-container">
          <button 
            className="debug-button"
            onClick={toggleDebugInfo}
          >
            {showDebug ? 'Hide Debug' : 'Debug'}
          </button>
          {showDebug && (
            <div className="debug-info">
              <p>Delivery Group BID: {deliveryGroup.bid}</p>
              <p>Business ID: {businessId}</p>
              <p>Business Type: "{businessType}"</p>
              <p>Is Restaurant: {isRestaurant ? 'Yes' : 'No'}</p>
              <p>Is External: {isExternalDelivery ? 'Yes' : 'No'}</p>
              <p>Show Vendor: {showVendor ? 'Yes' : 'No'}</p>
              <p>Can Abort: {canAbortGroup ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      )}
      <div className="delivery-group-header">
        <div className="delivery-group-main-info">
          <div className="courier-info">
            <div className="courier-name">{deliveryGroup.courier_name || t('unknown_courier')}</div>
            {/* Vendor indicator - only for restaurants viewing vendor groups */}
            {showVendor && (
              <div className="vendor-name-wrapper">
                <div className="vendor-name-label">{t('delivered_by_vendor')}:</div>
                <div className="vendor-name-value">{vendorName}</div>
              </div>
            )}
            <div className="courier-status">{t(deliveryGroup.status.toLowerCase())}</div>
          </div>
        </div>
        <div className="delivery-group-actions">
          <div className="order-count-badge">
            {t('orders_count_simple', { count: deliveryGroup.route.length })}
          </div>
          {/* Only show abort button if the current business owns this delivery group */}
          {canAbortGroup && (
            <button 
              className="abort-group-button" 
              onClick={() => onAbortDeliveryGroup(deliveryGroup._id)}
              title={t('orders_abort_assignment')}
            >
              {t('orders_abort_assignment')}
            </button>
          )}
          <button 
            className="finish-group-button" 
            onClick={() => onFinishDeliveryGroup(deliveryGroup._id)}
          >
            {t('orders_finish_route')}
          </button>
          <button 
            className="expand-button" 
            onClick={toggleExpand}
            aria-label={expanded ? t('collapse') : t('expand')}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="delivery-group-orders">
          <h4>{t('orders_in_route')}:</h4>
          <div className="order-list">
            {routeOrders.map(order => (
              <div key={order._id} className="route-order-item">
                {order.missing ? (
                  <div className="missing-order">{t('missing_order_data', { id: order._id })}</div>
                ) : (
                  <>
                    <div className="order-item-header">
                      <span className="order-id">{order.short_id || order._id}</span>
                      <span className={`order-status status-${order.latest_status?.toLowerCase()}`}>
                        {t(order.latest_status?.toLowerCase() || 'unknown')}
                      </span>
                    </div>
                    {/* Source Business - only show for vendors */}
                    {businessType === 'vendor' && (
                      <div className="order-item-source">
                        {t('source_business')}: {order.source_bid || order.bid}
                      </div>
                    )}
                    <div className="order-item-details">
                      <div className="order-customer">
                        {order.customer_name}
                        {(order.customer_phone_number || order.phone || order.customer_phone) && (
                          <span className="order-phone"> · {order.customer_phone_number || order.phone || order.customer_phone}</span>
                        )}
                      </div>
                      <div className="order-address">{order.address}</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="delivery-time-info">
        <div className="time-label">{t('assigned_at')}:</div>
        <div className="time-value">
          {new Date(deliveryGroup.timestamp).toLocaleTimeString()} 
        </div>
      </div>
    </div>
  );
};

export default DeliveryGroupCard; 