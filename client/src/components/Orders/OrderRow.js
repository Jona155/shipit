import React from 'react';
import { useTranslation } from 'react-i18next';
import {getOrderStatus} from "./orderUtils";

const OrderRow = ({ 
  order, 
  activeTab, 
  isSelected, 
  onSelectOrder, 
  onFinishOrder, 
  onUnassignOrder, 
  onReturnToOnTheirWay 
}) => {
  const { t } = useTranslation();

  console.log('Rendering OrderRow:', order);

  const orderStatus = getOrderStatus(order);

  return (
      <tr>
          {activeTab === 'accepted' && (
              <td>
                  <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectOrder(order._id)}
                  />
              </td>
          )}
          <td>{order.short_id || order._id}</td>
          <td>{order.customer_name}</td>
          <td>{order.address}</td>
          <td>{order.comments_for_order}</td>
          <td>{t(`order_status_${orderStatus}`)}</td>
          {(activeTab === 'on_their_way' || activeTab === 'finished') &&
              <td>{order.courier_name || order.courier_id || t('orders_unassigned')}</td>}
          <td>
              {activeTab === 'on_their_way' && (
                  <>
                      <button
                          className="finish-order-button"
                          onClick={() => onFinishOrder(order._id)}
                      >
                          {t('orders_finish')}
                      </button>
                      <button
                          className="unassign-order-button"
                          onClick={() => onUnassignOrder(order._id)}
                      >
                          {t('orders_unassign')}
                      </button>
                  </>
              )}
              {activeTab === 'finished' && (
                  <button
                      className="return-to-route-button"
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