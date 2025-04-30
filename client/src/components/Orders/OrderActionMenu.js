import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, XCircle, CheckCircle, Ban, Clock, Send } from 'lucide-react'; // Import necessary icons
import './OrdersList.css'; // For action-pill styles

const OrderActionMenu = ({ 
  order,
  activeTab,
  businessType,
  // Action Handlers
  onSendToTender,
  onViewTenderStatus,
  onCancelTender,     
  onApproveTender,    
  onDisapproveTender, 
  onFinishOrder,      
  onUnassignOrder,    
  onReturnToOnTheirWay 
}) => {
  const { t } = useTranslation();

  // Internal state checks
  const isInTender = order.in_tender === true;
  const hasSelectedWinner = order.selected_vendor != null;
  const orderId = order._id;
  const isVendor = businessType === 'vendor';

  // --- Source Business Actions --- 
  if (!isVendor) {
    if (activeTab === 'accepted') {
      if (isInTender) {
        // Order is IN TENDER - Icon buttons
        return (
          <>
            <button 
              className="action-pill secondary icon-button" 
              title={t('view_tender_tooltip')} 
              onClick={() => onViewTenderStatus(orderId, order)}
            >
              <Eye size={16} />
              <span className="button-text-mobile">{t('view_tender')}</span>
            </button>
            <button 
              className="action-pill danger icon-button" 
              title={hasSelectedWinner ? t('cannot_cancel_after_selection') : t('cancel_tender_tooltip')}
              onClick={() => onCancelTender(orderId)}
              disabled={hasSelectedWinner}
            >
              <XCircle size={16} />
               <span className="button-text-mobile">{t('cancel_tender')}</span>
            </button>
          </>
        );
      } else {
        // Order is NOT in tender - show Send to Tender (Text button)
        return (
          <button 
            className="action-pill primary" 
            title={t('send_to_tender_tooltip')} 
            onClick={() => onSendToTender(orderId)}
          >
            {/* Use Send icon optionally? */}
            {/* <Send size={14} /> */} 
            {t('send_to_tender')}
          </button>
        );
      }
    }
    if (activeTab === 'on_their_way') { 
      // Icon buttons for Finish/Unassign
      return (
        <>
           <button 
              className="action-pill primary icon-button" 
              title={t('orders_finish')}
              onClick={() => onFinishOrder(orderId)}
            >
              <CheckCircle size={16} />
               <span className="button-text-mobile">{t('orders_finish')}</span>
            </button>
            <button 
              className="action-pill secondary icon-button" 
              title={t('orders_unassign')}
              onClick={() => onUnassignOrder(orderId)}
            >
              <Ban size={16} />
               <span className="button-text-mobile">{t('orders_unassign')}</span>
            </button>
        </>
      );
    }
    if (activeTab === 'finished') {
       // Icon button for Return
      return (
          <button 
            className="action-pill secondary icon-button" 
            title={t('orders_return')}
            onClick={() => onReturnToOnTheirWay(orderId)}
          >
            <Clock size={16} /> 
            <span className="button-text-mobile">{t('orders_return')}</span>
          </button>
      );
    }
  }
  // --- Vendor Actions --- 
  else {
    if (activeTab === 'accepted') {
       if (isInTender && !hasSelectedWinner) {
          // Text buttons for Approve/Decline
          const hasApproved = order.my_tender_status === 'APPROVED';
          const hasDeclined = order.my_tender_status === 'DISAPPROVED';
          return (
            <>
              <button 
                className={`action-pill success ${hasApproved ? 'active' : ''}`} 
                title={t('approve_tender_tooltip')} 
                onClick={() => onApproveTender(orderId)} 
                disabled={hasApproved || hasDeclined}
              >
                {t('approve_tender')}
              </button>
              <button 
                className={`action-pill danger ${hasDeclined ? 'active' : ''}`} 
                title={t('decline_tender_tooltip')} 
                onClick={() => onDisapproveTender(orderId)} 
                disabled={hasApproved || hasDeclined}
              >
                {t('disapprove_tender')}
              </button>
            </>
          );
        }
        // Potentially add 'Finish' action if vendor won and order is assigned to them?
        // This might require passing courierId/deliveryGroup info down
    }
    // Add vendor actions for 'on_their_way' (e.g., Finish) if needed
  }

  return null; // Default no actions
};

export default OrderActionMenu; 