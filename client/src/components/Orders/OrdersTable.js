import React from 'react';
import { useTranslation } from 'react-i18next';
import OrderRow from './OrderRow';
import './OrdersTable.css';
import {getOrderStatus} from "./orderUtils";

const OrdersTable = ({ 
  orders, 
  activeTab, 
  setActiveTab,
  selectedOrders, 
  onSelectOrder, 
  onFinishOrder, 
  onUnassignOrder, 
  onReturnToOnTheirWay,
  onFinishRoute,
  searchTerm,
  setSearchTerm,
  onAddOrder,
  isMapView,
  isSelectingForRoute,
  onBuildRoute,
  onCancelBuildRoute
}) => {
  const { t } = useTranslation();


 const groupedOrders = orders.reduce((acc, order) => {
  const status = getOrderStatus(order);
  if (status === 'on_their_way') {
    const courier = order.courier_name || order.courier_id || t('orders_unassigned');
    if (!acc[courier]) {
      acc[courier] = [];
    }
    acc[courier].push(order);
  } else {
    const groupName = status === 'finished' ? t('orders_finished') : t('orders_accepted');
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(order);
  }
  return acc;
}, {});

  console.log('Grouped orders:', groupedOrders);

  return (
    <div className="orders-table-container">
      <div className="orders-table-header">
        <input
          type="text"
          className="search-input"
          placeholder={t('search_orders')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="tabs">
          {['accepted', 'on_their_way', 'finished'].map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {t(`orders_${tab}`)}
            </button>
          ))}
        </div>
        {isMapView && (
          <button 
            className={`build-route-button ${isSelectingForRoute ? 'cancel' : ''}`}
            onClick={isSelectingForRoute ? onCancelBuildRoute : onBuildRoute}
          >
            {isSelectingForRoute ? t('cancel_build_route') : t('build_route')}
          </button>
        )}
      </div>
      {Object.entries(groupedOrders).map(([group, groupOrders]) => (
        <div key={group}>
          <div className="group-header">
            <h2>{group}</h2>
            {activeTab === 'on_their_way' && group !== t('orders_unassigned') && (
              <button 
                className="finish-route-button"
                onClick={() => onFinishRoute(group)}
              >
                {t('orders_finish_route')}
              </button>
            )} 
          </div>
          <table className="orders-table">
            <thead>
            <tr>
              {activeTab === 'accepted' && <th>{t('orders_select')}</th>}
              <th>{t('orders_id')}</th>
              <th>{t('orders_customer')}</th>
              <th>{t('orders_address')}</th>
              <th>{t('orders_items')}</th>
              <th>{t('orders_status')}</th>
              {(activeTab === 'on_their_way' || activeTab === 'finished') && <th>{t('orders_courier')}</th>}
              <th>{t('orders_action')}</th>
            </tr>
            </thead>
            <tbody>
            {groupOrders.map(order => (
                <OrderRow
                    key={order._id}
                    order={order}
                    activeTab={activeTab}
                    isSelected={selectedOrders.includes(order._id)}
                    onSelectOrder={onSelectOrder}
                    onFinishOrder={onFinishOrder}
                    onUnassignOrder={onUnassignOrder}
                    onReturnToOnTheirWay={onReturnToOnTheirWay}
                />
            ))}
            </tbody>
          </table>
        </div>
      ))}
      <div className="add-order-row">
        <button className="add-order-button" onClick={onAddOrder}>
          {t('add_order')}
        </button>
      </div>
    </div>
  );
};

export default OrdersTable;