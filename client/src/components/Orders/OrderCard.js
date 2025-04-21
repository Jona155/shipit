import React from 'react';
import { useTranslation } from 'react-i18next';
import { getOrderStatus } from './orderUtils';

const OrderCard = ({
  order,
  activeTab,
  isSelected,
  onSelectOrder,
  onFinishOrder,
  onUnassignOrder,
  onReturnToOnTheirWay,
  isVendorPage,
  isRTL
}) => {
  const { t } = useTranslation();
  const orderStatus = getOrderStatus(order);

  // In vendor view, show the restaurant name (order.sent_from)
  // In restaurant view, show the vendor name (order.sent_to_3rd_party)
  const partnerName = order.third_party
    ? (isVendorPage ? (order.sent_from || '-') : (order.sent_to_3rd_party || '-'))
    : '-';

  return (
    <div className={`order-card ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="order-card-header">
        <div className="order-id">
          {activeTab === 'accepted' && (
            <input
              type="checkbox"
              className="card-checkbox"
              checked={isSelected}
              onChange={() => onSelectOrder(order._id)}
            />
          )}
          {order.short_id || order._id}
        </div>
        <div className={`order-status status-${orderStatus}`}>
          {t(orderStatus)}
        </div>
      </div>
      
      <div className="order-card-content">
        <div className="order-detail">
          <div className="detail-label">{t('orders_customer')}:</div>
          <div className="detail-value">{order.customer_name}</div>
        </div>
        
        <div className="order-detail">
          <div className="detail-label">{t('orders_phone_number')}:</div>
          <div className="detail-value">{order.customer_phone_number}</div>
        </div>
        
        <div className="order-detail">
          <div className="detail-label">{t('orders_address')}:</div>
          <div className="detail-value">{order.address}</div>
        </div>
        
        <div className="order-detail">
          <div className="detail-label">{t('orders_items')}:</div>
          <div className="detail-value">{order.comments_for_order}</div>
        </div>
        
        {(activeTab === 'on_their_way' || activeTab === 'finished') && (
          <div className="order-detail">
            <div className="detail-label">{t('orders_courier')}:</div>
            <div className="detail-value">
              {order.third_party && order.sent_from
                ? t('orders_received_from', { restaurant: order.sent_from })
                : (order.courier_name || order.courier_id || t('orders_unassigned'))}
            </div>
          </div>
          
        )}
        
        {(activeTab === 'on_their_way' || activeTab === 'finished') && (
          <div className="order-detail">
            <div className="detail-label">{isVendorPage ? t('orders_partner_restaurant') : t('orders_partner_vendor')}:</div>
            <div className="detail-value">
              {partnerName}
            </div>
          </div>
        )}
      </div>
      
      <div className="order-card-actions">
        {activeTab === 'on_their_way' && (
          <>
            <button
              className="action-button finish-button"
              onClick={() => onFinishOrder(order._id)}
            >
              {t('orders_finish')}
            </button>
            <button
              className="action-button unassign-button"
              onClick={() => onUnassignOrder(order._id)}
            >
              {t('orders_unassign')}
            </button>
          </>
        )}
        {activeTab === 'finished' && (
          <button
            className="action-button return-button"
            onClick={() => onReturnToOnTheirWay(order._id)}
          >
            {t('orders_return')}
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard; 