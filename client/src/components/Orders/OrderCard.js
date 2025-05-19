import React from 'react';
import { useTranslation } from 'react-i18next';
import { getOrderStatus } from './orderUtils';
import SLATimer from './SLATimer';
import OrderCardDetails from './OrderCardDetails';
import DeleteOrderIcon from './DeleteOrderIcon';

const OrderCard = ({
  order,
  activeTab,
  isSelected,
  onSelectOrder,
  onFinishOrder,
  onUnassignOrder,
  onReturnToOnTheirWay,
  onSendToTender,
  onCancelTender,
  onViewTenderStatus,
  onDeleteOrder,
  isRTL,
  businessSLA,
  isVendor
}) => {
  const { t } = useTranslation();
  const orderStatus = getOrderStatus(order);
  
  const orderTime = order.status?.[order.status.length - 1]?.timestamp || order.creation_time || order.created_at;

  const isAssignable = orderStatus === 'accepted' && !order.in_tender;
  const isInTender = order.in_tender === true;
  const hasSelectedWinner = order.selected_vendor != null;

  return (
    <div className={`order-card ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="order-card-header">
        <div className="order-id">
          {!isVendor && (
            <DeleteOrderIcon 
              orderShortId={order.short_id || order._id} 
              onClick={() => onDeleteOrder(order._id, order.short_id || order._id)} 
              isVendor={isVendor}
            />
          )}
          {activeTab === 'accepted' && !order.in_tender && (
            <input
              type="checkbox"
              className="card-checkbox"
              checked={isSelected}
              onChange={() => onSelectOrder(order._id)}
            />
          )}
          {order.short_id || order._id}
        </div>
        <div className="order-header-right">
          {businessSLA && orderTime && (
            <div className="timer-container">
              <SLATimer orderTime={orderTime} slaMinutes={businessSLA} />
            </div>
          )}
          <div className={`order-status status-${orderStatus}`}>
            {t(orderStatus)}
            {isInTender && (
              <span className="status-badge-container">
                {hasSelectedWinner ? (
                  <span className="winner-badge">
                    {t('winner')}: {
                      order.tender_scope?.find(vendor => 
                        (vendor.vendor_bid || vendor.tender_bid) === order.selected_vendor
                      )?.vendor_bid || 
                      order.tender_scope?.find(vendor => 
                        (vendor.vendor_bid || vendor.tender_bid) === order.selected_vendor
                      )?.tender_bid || 
                      order.selected_vendor
                    }
                  </span>
                ) : (
                  <span className="tender-badge">
                    {t('in_tender')}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <OrderCardDetails order={order} isRTL={isRTL} businessType="source" />
      
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
        {isAssignable && (
          <button
            className="action-button tender-button"
            onClick={() => onSendToTender(order._id)}
            title={t('send_to_tender_tooltip')}
          >
            {t('send_to_tender')}
          </button>
        )}
        {isInTender && (
          <>
            <button
              className="action-button view-tender-button"
              onClick={() => onViewTenderStatus(order._id, order)}
              title={t('view_tender_tooltip')}
            >
              {t('view_tender')}
            </button>
            <button
              className="action-button cancel-tender-button"
              onClick={() => onCancelTender(order._id)}
              title={hasSelectedWinner ? t('cannot_cancel_after_selection') : t('cancel_tender_tooltip')}
              disabled={hasSelectedWinner}
            >
              {t('cancel_tender')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderCard; 