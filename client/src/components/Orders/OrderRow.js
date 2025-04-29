// OrderRow.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getOrderStatus } from "./orderUtils";

const OrderRow = ({ 
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

  return (
    <tr>
      {activeTab === 'accepted' && (
        <td className={isRTL ? 'rtl' : 'ltr'}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectOrder(order._id)}
          />
        </td>
      )}
      <td className={isRTL ? 'rtl' : 'ltr'}>{order.short_id || order._id}</td>
      <td className={isRTL ? 'rtl' : 'ltr'}>{order.customer_name}</td>
      <td className={isRTL ? 'rtl' : 'ltr'}>{order.address}</td>
      <td className={isRTL ? 'rtl' : 'ltr'}>{order.comments_for_order}</td>
      <td className={isRTL ? 'rtl' : 'ltr'}>{t(orderStatus)}</td>
      {(activeTab === 'on_their_way' || activeTab === 'finished') && (
        <td className={isRTL ? 'rtl' : 'ltr'}>
          {order.courier_name || order.courier_id || t('orders_unassigned')}
        </td>
      )}
      <td className={isRTL ? 'rtl' : 'ltr'}>
        {activeTab === 'on_their_way' && (
          <>
            <button
              className={`finish-order-button ${isRTL ? 'rtl' : 'ltr'}`}
              onClick={() => onFinishOrder(order._id)}
            >
              {t('orders_finish')}
            </button>
            <button
              className={`unassign-order-button ${isRTL ? 'rtl' : 'ltr'}`}
              onClick={() => onUnassignOrder(order._id)}
            >
              {t('orders_unassign')}
            </button>
          </>
        )}
        {activeTab === 'finished' && (
          <button
            className={`return-to-route-button ${isRTL ? 'rtl' : 'ltr'}`}
            onClick={() => onReturnToOnTheirWay(order._id)}
          >
            {t('orders_return')}
          </button>
        )}
      </td>
    </tr>
  );
};

export default OrderRow;
