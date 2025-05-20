import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import OrderCardDetails from './OrderCardDetails';
import SLATimer from './SLATimer';
import { getOrderStatus } from './orderUtils';
import { formatDateForDisplay, correctServerTimestamp } from '../../utils/timeUtils';

const VendorOrderCard = ({ 
  order, 
  onApproveTender, 
  onDisapproveTender, 
  businessSLA, 
  isRTL, 
  businessId, 
  isSelected,
  onSelectOrder
}) => {
  const { t } = useTranslation();
  const orderStatus = getOrderStatus(order);
  const orderTime = order.status?.[order.status.length - 1]?.timestamp || order.creation_time || order.created_at;
  const correctedOrderTime = orderTime ? correctServerTimestamp(orderTime) : null;


  // --- State Determination ---
  const isInTender = order.in_tender === true;
  const tenderStatus = order.my_tender_status || ''; 
  const hasApproved = tenderStatus === 'APPROVED';
  const hasDeclined = tenderStatus === 'DISAPPROVED';
  const hasSelectedWinner = order.selected_vendor != null;
  
  // Correct way to check if THIS vendor won - fixed to be type-safe
  const isWon = hasSelectedWinner && String(order.selected_vendor) === String(businessId);
  
  // Log the result of isWon calculation
  console.log("isWon calculation:", { 
    hasSelectedWinner, 
    selected_vendor: String(order.selected_vendor), 
    businessId: String(businessId),
    isEqual: String(order.selected_vendor) === String(businessId),
    isWon
  });
  
  // State for when tender is open for this vendor
  const isStillInTender = isInTender && !hasSelectedWinner;
  // State for when the vendor lost
  const isLost = isInTender && hasSelectedWinner && !isWon;

  // Determine if the checkbox should be shown - simplified to just isWon
  const showCheckbox = isWon;
  
  // Log the final result
  console.log("Checkbox visibility:", { 
    isWon, 
    showCheckbox,
    checkboxRendered: Boolean(showCheckbox)
  });

  return (
    <div className={`order-card ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="order-card-header">
        <div className="order-id">
          {/* Conditionally render checkbox for vendors */}
          {showCheckbox && (
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
          {/* SLA Timer - Vendors might see this */}
          {businessSLA && orderTime && (
            <div className="timer-container">
              <SLATimer orderTime={orderTime} slaMinutes={businessSLA} />
            </div>
          )}
          {/* Vendor sees their own status differently */}
          <div className={`order-status status-${orderStatus}`}>
            {/* State 1: Vendor Won */}
            {isWon && (
              <span className="tender-state-badge tender-won">
                {t('youre_selected', 'You\'re selected')}
              </span>
            )}
            {/* State 2: Still In Tender */}
            {isStillInTender && (
              <span className="tender-state-badge tender-open">
                {t('awaiting_decision', 'Awaiting decision')}
              </span>
            )}
            {/* State 3: Not in tender OR Vendor Lost (Show default status) */}
            {(!isInTender || isLost) && (
               <span>{t(orderStatus)}</span>
            )}
          </div>
          {orderTime && (
            <div className="order-time">
              {formatDateForDisplay(correctedOrderTime, 'Asia/Jerusalem', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* Use the shared details component */}
      <OrderCardDetails order={order} isRTL={isRTL} businessType="vendor" />

      {/* Actions specific to Vendor */}
      <div className="order-card-actions">
        {/* State 1: Still in tender - Show buttons and message */}
        {isStillInTender && (
          <>
            <div className="tender-footer-message">
              {t('tender_open_can_act', 'Tender open – you may approve/reject')}
            </div>
            <div className="tender-response-buttons">
              <button
                className={`action-button approve-tender-button ${hasApproved ? 'active' : ''}`}
                onClick={() => onApproveTender(order._id)}
                title={hasApproved ? t('approved_tender_active') : t('approve_tender_tooltip')}
                aria-pressed={hasApproved}
                disabled={hasApproved || hasDeclined}
              >
                {hasApproved ? `✓ ${t('approved')}` : t('approve_tender')}
              </button>
              <button
                className={`action-button disapprove-tender-button ${hasDeclined ? 'active' : ''}`}
                onClick={() => onDisapproveTender(order._id)}
                title={hasDeclined ? t('declined_tender_active') : t('decline_tender_tooltip')}
                aria-pressed={hasDeclined}
                disabled={hasApproved || hasDeclined}
              >
                {hasDeclined ? `✕ ${t('declined')}` : t('disapprove_tender')}
              </button>
            </div>
          </>
        )}
        {/* State 2: Vendor Lost - Show specific message */}
        {isLost && (
          <div className="tender-status tender-footer-message">
            {t('tender_closed_other_winner')}
          </div>
        )}
        {/* State 3: Not in tender - Show specific message */}
        {!isInTender && (
          <div className="tender-status tender-footer-message">
            {t('not_in_tender')}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorOrderCard; 