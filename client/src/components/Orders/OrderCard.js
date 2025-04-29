import React from 'react';
import { useTranslation } from 'react-i18next';
import { getOrderStatus } from './orderUtils';
import SLATimer from './SLATimer';

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
  isVendorPage,
  isRTL,
  businessType,
  onApproveTender,
  onDisapproveTender,
  businessSLA
}) => {
  const { t } = useTranslation();
  const orderStatus = getOrderStatus(order);

  // Get order time from the order status array and adjust for Israel timezone (UTC+3)
  const getAdjustedOrderTime = () => {
    let timestamp;
    if (order.status && order.status.length > 0) {
      timestamp = order.status[order.status.length - 1].timestamp; // Last status is the earliest
    } else {
      timestamp = order.creation_time || order.created_at || new Date().toISOString(); // Fallback
    }
    
    // Create a date object from the timestamp
    const utcDate = new Date(timestamp);
    
    // Add 3 hours to adjust for Israel timezone (UTC+3)
    const israelDate = new Date(utcDate.getTime() + (3 * 60 * 60 * 1000));
    
    return israelDate.toISOString();
  };

  const orderTime = getAdjustedOrderTime();
  
  // Check if order is assignable (can be sent to tender)
  const isAssignable = orderStatus === 'accepted' && !order.in_tender;
  
  // Check if order is already in tender
  const isInTender = order.in_tender === true;
  
  // Determine if the vendor has already responded to the tender
  const tenderStatus = order.my_tender_status || '';
  const hasApproved = tenderStatus === 'APPROVED';
  const hasDeclined = tenderStatus === 'DISAPPROVED';
  
  // Check if a winner has been selected
  const hasSelectedWinner = order.selected_vendor != null;

  return (
    <div className={`order-card ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="order-card-header">
        <div className="order-id" title={isInTender ? t('cannot_assign_while_in_tender') : ''}>
          {activeTab === 'accepted' && (
            <input
              type="checkbox"
              className="card-checkbox"
              checked={isSelected}
              onChange={() => onSelectOrder(order._id)}
              disabled={isInTender}
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
                      // Find vendor in tender_scope to display name
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
              {order.courier_name || order.courier_id || t('orders_unassigned')}
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
        {isAssignable && !isInTender && !isVendorPage && (
          <button
            className="action-button tender-button"
            onClick={() => onSendToTender(order._id)}
            title={t('send_to_tender_tooltip')}
          >
            {t('send_to_tender')}
          </button>
        )}
        {isInTender && businessType !== 'vendor' && !isVendorPage && (
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
        {businessType === 'vendor' && isInTender && (
          <div className="tender-response-buttons">
            <button
              className={`action-button approve-tender-button ${hasApproved ? 'active' : ''}`}
              onClick={() => onApproveTender(order._id)}
              title={hasApproved ? t('approved_tender_active') : t('approve_tender_tooltip')}
              aria-pressed={hasApproved}
            >
              {hasApproved ? `✓ ${t('approved')}` : t('approve_tender')}
            </button>
            <button
              className={`action-button disapprove-tender-button ${hasDeclined ? 'active' : ''}`}
              onClick={() => onDisapproveTender(order._id)}
              title={hasDeclined ? t('declined_tender_active') : t('decline_tender_tooltip')}
              aria-pressed={hasDeclined}
            >
              {hasDeclined ? `✕ ${t('declined')}` : t('disapprove_tender')}
            </button>
          </div>
        )}
        {businessType === 'vendor' && !isInTender && (
          <div className="tender-status">
            {t('not_in_tender')}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard; 