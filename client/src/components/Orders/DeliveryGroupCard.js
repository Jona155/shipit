import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './DeliveryGroupCard.css';

const DeliveryGroupCard = ({
  deliveryGroup,
  onFinishDeliveryGroup,
  isRTL,
  orders
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Find full order objects for each order in the route
  const routeOrders = deliveryGroup.route.map(routeItem => {
    const fullOrder = orders.find(order => order._id === routeItem.orderId);
    return fullOrder || { _id: routeItem.orderId, missing: true };
  });

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`delivery-group-card ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="delivery-group-header">
        <div className="delivery-group-main-info">
          <div className="courier-info">
            <div className="courier-name">{deliveryGroup.courier_name || t('unknown_courier')}</div>
            <div className="courier-status">{t(deliveryGroup.status.toLowerCase())}</div>
          </div>
        </div>
        <div className="delivery-group-actions">
          <div className="order-count-badge">
            {t('orders_count_simple', { count: deliveryGroup.route.length })}
          </div>
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
                    <div className="order-item-details">
                      <div className="order-customer">{order.customer_name}</div>
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