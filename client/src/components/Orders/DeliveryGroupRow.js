import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, UserCircle } from 'lucide-react';
import OrderRow from './OrderRow'; // We'll reuse OrderRow for the nested list
import { getStatusBarClass } from '../../utils/designTokens'; // Use for consistency if needed
import './OrdersList.css'; // Reuse styles
import './DeliveryGroupRow.css'; // Specific styles for this component

// Helper to get initials (reuse or move to utils)
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return name.substring(0, 1).toUpperCase();
  return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
};

const DeliveryGroupRow = ({ 
  deliveryGroup, 
  onFinishDeliveryGroup, 
  onAbortDeliveryGroup, 
  isRTL, 
  orders, // Full list of orders to find details for nested rows
  businessType, 
  businessId 
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const courierName = deliveryGroup.courier_name;
  const orderCount = deliveryGroup.route?.length || 0;
  const groupTimestamp = deliveryGroup.timestamp;
  const groupStatus = deliveryGroup.status || 'assigned'; // Default to assigned

  // Find the full order objects for the route
  const routeOrders = deliveryGroup.route
    .map(routeItem => orders.find(order => order._id === routeItem.orderId))
    .filter(Boolean); // Filter out any orders not found

  // Determine if the current business can abort this group
  const canAbortGroup = deliveryGroup.bid === businessId;
  // Determine if this group is managed by a vendor (from restaurant perspective)
  const isExternalDelivery = (businessType === 'restaurant' || !businessType) && deliveryGroup.bid !== businessId;

  const toggleExpand = (e) => {
    // Prevent toggling when clicking on action buttons within the row
    if (e.target.closest('.action-pill')) {
        return;
    }
    setExpanded(!expanded);
  };
  
  // We don't have SLA/late status for groups yet, so use a simple status bar
  const statusBarClass = getStatusBarClass(groupStatus.toLowerCase(), false); 

  return (
    <div className={`delivery-group-wrapper ${isRTL ? 'rtl' : 'ltr'}`}>
      <div 
        className={`order-row delivery-group-row ${isRTL ? 'rtl' : 'ltr'} ${expanded ? 'expanded' : ''}`}
        onClick={toggleExpand}
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={`group-orders-${deliveryGroup._id}`}
      >
        {/* Status Bar */} 
        <div className={`status-bar ${statusBarClass}`}></div>
        
        {/* Column 1: Courier Avatar + Name */}
        <div className="order-col col-courier">
          {courierName ? (
            <div className="courier-avatar" title={courierName}>{getInitials(courierName)}</div>
          ) : (
            <div className="courier-avatar placeholder" title={t('unassigned')}><UserCircle size={16} /></div>
          )}
          <span className="courier-name" title={courierName}>{courierName || t('unassigned')}</span>
          {isExternalDelivery && (
             <span className="vendor-tag">({deliveryGroup.bid})</span> // Show vendor BID if external
          )}
        </div>

        {/* Column 2: Status (fixed) + Order Count */}
        <div className="order-col col-group-status">
          <span className={`status-chip status-${groupStatus.toLowerCase()}`}>{t(groupStatus.toLowerCase())}</span>
          <span className="order-count">{t('orders_count_simple', { count: orderCount })}</span>
        </div>

        {/* Column 3: Timestamp */}
        <div className="order-col col-time">
          <Clock className="time-icon" title={t('assigned_at')} />
          <span className="time-text" title={groupTimestamp ? new Date(groupTimestamp).toLocaleString() : ''}>
            {groupTimestamp ? new Date(groupTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </span>
        </div>

        {/* Column 4: Actions + Expand Toggle */}
        <div className="order-col col-actions">
          {canAbortGroup && (
             <button 
                className="action-pill danger icon-button" 
                title={t('orders_abort_assignment')}
                onClick={(e) => { e.stopPropagation(); onAbortDeliveryGroup(deliveryGroup._id); }} // Prevent row click
              >
                <XCircle size={16} />
                <span className="button-text-mobile">{t('orders_abort_assignment')}</span>
              </button>
          )}
           <button 
              className="action-pill primary icon-button" 
              title={t('orders_finish_route')}
              onClick={(e) => { e.stopPropagation(); onFinishDeliveryGroup(deliveryGroup._id); }} // Prevent row click
            >
              <CheckCircle size={16} />
              <span className="button-text-mobile">{t('orders_finish_route')}</span>
            </button>
           <button 
              className="expand-toggle icon-button action-pill" 
              onClick={toggleExpand} 
              aria-label={expanded ? t('collapse') : t('expand')}
           >
             {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
           </button>
        </div>
      </div>

      {/* Expanded Section: Nested Order List */} 
      {expanded && (
        <div className="nested-orders-list" id={`group-orders-${deliveryGroup._id}`}>
          {routeOrders.length > 0 ? (
            routeOrders.map(order => (
              <OrderRow
                key={order._id}
                order={order}
                isRTL={isRTL}
                // Pass relevant props - note actions might not apply here
                businessType={businessType} 
                activeTab={activeTab} // Pass activeTab if OrderRow logic depends on it
                // Do not pass selection props unless needed inside group
                // isSelected={false} 
                // onSelectOrder={() => {}} 
              />
            ))
          ) : (
            <div className="no-orders-nested">{t('no_orders_in_group', 'No orders found in this group.')}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryGroupRow; 