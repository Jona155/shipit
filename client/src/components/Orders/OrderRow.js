import { t } from 'i18next';
import React from 'react';

const OrderRow = ({ 
  order, 
  activeTab, 
  isSelected, 
  onSelectOrder, 
  onFinishOrder, 
  onUnassignOrder, 
  onReturnToOnTheirWay 
}) => {
  return (
    <tr>
      {activeTab === 'Accepted' && (
        <td>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectOrder(order.id)}
          />
        </td>
      )}
      <td>{order.id}</td>
      <td>{order.customer}</td>
      <td>{order.address}</td>
      <td>{order.items}</td>
      <td>{order.status}</td>
      {(activeTab === 'On Their Way' || activeTab === 'Finished') && <td>{order.courier}</td>}
      <td>
        {activeTab === 'On Their Way' && (
          <>
            <button 
              className="finish-order-button"
              onClick={() => onFinishOrder(order.id)}
            >
              {t('orders_finish')}
            </button>
            <button 
              className="unassign-order-button"
              onClick={() => onUnassignOrder(order.id)}
            >
              {t('orders_unassign')}
            </button>
          </>
        )}
        {activeTab === 'Finished' && (
          <button 
            className="return-to-route-button"
            onClick={() => onReturnToOnTheirWay(order.id)}
          >
            {t('orders_return')}
          </button>
        )}
      </td>
    </tr>
  );
};

export default OrderRow;