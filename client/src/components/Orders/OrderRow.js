// OrderRow.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, MapPin, Clock, AlertTriangle, UserCircle } from 'lucide-react'; 
import OrderStatusChip from './OrderStatusChip'; // Import new component
import OrderActionMenu from './OrderActionMenu'; // Import new component
import DeleteOrderIcon from './DeleteOrderIcon'; // Import the delete icon component
import { getStatusBarClass } from '../../utils/designTokens'; // Import helper
import './OrdersList.css'; 
import { getOrderStatus } from "./orderUtils";

// Navigation URL function (keep here or move to utils)
const navUrlFor = (addr) => {
  if (!addr || typeof addr !== 'string') return '#'; 
  const encoded = encodeURIComponent(addr);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isMobile
    ? `https://waze.com/ul?q=${encoded}&navigate=yes`
    : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
};

// Initials helper (keep here or move to utils)
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return name.substring(0, 1).toUpperCase();
  return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
};

const OrderRow = ({ 
  order, 
  activeTab, 
  isSelected, 
  onSelectOrder, 
  // Pass all action handlers down to OrderActionMenu
  onSendToTender,
  onViewTenderStatus, 
  onCancelTender,     
  onApproveTender,    
  onDisapproveTender, 
  onFinishOrder,      
  onUnassignOrder,    
  onReturnToOnTheirWay, 
  onDeleteOrder, // Add delete handler
  // Other props
  isRTL,
  businessType,
  businessSLA,
  businessId,
  isVendor // Add vendor flag
}) => {
  const { t } = useTranslation();
  const orderStatus = getOrderStatus(order);

  // --- Data Extraction (remains the same) ---
  const orderId = order.short_id || order._id;
  const customerName = order.customer_name || 'N/A';
  const addressString = typeof order.address === 'string' ? order.address : 'N/A'; 
  const phoneNumber = order.customer_phone_number || order.phone || order.customer_phone;
  const orderTimestamp = order.status?.[0]?.timestamp || order.creation_time || order.created_at;
  const courierName = order.courier_name;
  const isInTender = order.in_tender === true;
  
  // --- Lateness Calculation (remains the same) ---
  let isLate = false;
  if (orderStatus === 'accepted' && businessSLA && orderTimestamp) {
    const orderDate = new Date(orderTimestamp);
    const slaMillis = businessSLA * 60 * 1000;
    const deadline = new Date(orderDate.getTime() + slaMillis);
    isLate = new Date() > deadline;
  }
  
  // --- Other State Checks (remains the same) ---
  const showCheckbox = (activeTab === 'accepted' && businessType !== 'vendor' && !isInTender) || 
                      // Allow vendor checkboxes when they've won the tender
                      (businessType === 'vendor' && order.selected_vendor && String(order.selected_vendor) === String(businessId));
  const statusBarClass = getStatusBarClass(orderStatus, isLate);

  // Consolidate action handlers into a single object for cleaner passing
  const actionHandlers = {
      onSendToTender,
      onViewTenderStatus, 
      onCancelTender,     
      onApproveTender,    
      onDisapproveTender, 
      onFinishOrder,      
      onUnassignOrder,    
      onReturnToOnTheirWay
  };

  return (
    <div 
      className={`order-row ${isRTL ? 'rtl' : 'ltr'} ${isLate ? 'late' : ''}`}
      tabIndex={0} 
      aria-labelledby={`order-id-${orderId}`}
    >
       {/* Vertical Status Bar */}
      <div className={`status-bar ${statusBarClass}`}></div>

      {/* Column 1: Status Chip + Order Number + Selection */}
      <div className="order-col col-status">
        {/* Add Delete Icon for non-vendor users */}
        {!isVendor && (
          <DeleteOrderIcon 
            orderShortId={orderId}
            onClick={() => onDeleteOrder(order._id, orderId)} 
            isVendor={isVendor}
            className="delete-order-icon-row"
          />
        )}
        {showCheckbox && (
          <input
            type="checkbox"
            className="order-row-checkbox"
            checked={isSelected}
            onChange={() => onSelectOrder(order._id)}
            aria-label={`Select order ${orderId}`}
          />
        )}
        {/* Use OrderStatusChip component */} 
        <OrderStatusChip status={orderStatus} /> 
        {/* Conditionally show In Tender chip */}
        {isInTender && businessType !== 'vendor' && (
            <OrderStatusChip status={'in_tender'} /> 
        )}
        <span className="order-row-id" title={orderId} id={`order-id-${orderId}`}>{orderId}</span>
      </div>

      {/* Column 2: Customer & Address (remains the same) */}
      <div className="order-col col-customer">
        <div className="customer-name" title={customerName}>{customerName}</div>
        <div className="address-line">
          <span className="address-text" title={addressString}>{addressString}</span>
          {addressString !== 'N/A' && (
            <a href={navUrlFor(addressString)} className="map-icon-link" target="_blank" rel="noopener noreferrer" aria-label={t('navigate_to_address')} title={t('navigate_to_address')}>
              <MapPin className="map-icon" />
            </a>
          )}
        </div>
        {phoneNumber && (
          <div className="order-phone-line">
            <span title={phoneNumber}>{phoneNumber}</span> 
            <a
              href={`tel:${phoneNumber}`}
              className="phone-icon-link"
              aria-label={t('call_customer')}
              title={t('call_customer')}
            >
              <Phone className="phone-icon" />
            </a>
          </div>
        )}
      </div>

      {/* Column 3: Timestamp / ETA + Avatar (remains the same) */}
      <div className="order-col col-time">
         {activeTab === 'on_their_way' && (
           courierName ? (
              <div className="courier-avatar" title={courierName}>{getInitials(courierName)}</div>
           ) : (
              <div className="courier-avatar placeholder" title={t('unassigned')}><UserCircle size={16} /></div>
           )
         )}
        <Clock className="time-icon" title={t('order_time', 'Order Time')} />
        <span className="time-text" title={orderTimestamp ? new Date(orderTimestamp).toLocaleString() : ''}>
          {orderTimestamp ? new Date(orderTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </span>
        {isLate && <AlertTriangle className="late-icon" title={t('order_is_late')} />}
      </div>

      {/* Column 4: Actions - Use OrderActionMenu component */}
      <div className="order-col col-actions">
        <OrderActionMenu 
           order={order}
           activeTab={activeTab}
           businessType={businessType}
           {...actionHandlers} // Spread all action handlers
        />
      </div>
      
    </div>
  );
};

export default OrderRow;
