import React from 'react';
import { useTranslation } from 'react-i18next';
import EditOrderIcon from './EditOrderIcon';
import DeleteOrderIcon from './DeleteOrderIcon';
import './OrderActionIcons.css';

const OrderActionIcons = ({ 
  order, 
  onEditOrder, 
  onDeleteOrder, 
  isVendor,
  className = ''
}) => {
  const { t } = useTranslation();
  
  // If vendor, don't render action icons at all
  if (isVendor) {
    return null;
  }
  
  const canEditOrder = !isVendor;
  const shortId = order.short_id || (order._id ? order._id.substring(0, 4) : '');
  
  return (
    <div className={`order-action-icons ${className}`} onClick={e => e.stopPropagation()}>
      {canEditOrder && (
        <EditOrderIcon 
          onClick={() => onEditOrder(order)} 
          disabled={false} 
          orderId={shortId} 
        />
      )}
      <DeleteOrderIcon 
        orderShortId={shortId}
        onClick={() => onDeleteOrder(order._id, shortId)}
        isVendor={isVendor}
        isInTender={order.in_tender}
        hasSelectedVendor={order.selected_vendor}
      />
    </div>
  );
};

export default OrderActionIcons; 