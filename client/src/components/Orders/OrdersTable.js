// OrdersTable.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import OrderRow from './OrderRow';
import './OrdersTable.css';
import { getOrderStatus } from "./orderUtils";

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
  onFinishDeliveryGroup, // new prop
  searchTerm,
  setSearchTerm,
  onAddOrder,
  isMapView,
  isSelectingForRoute,
  onBuildRoute,
  onCancelBuildRoute
}) => {
  const { t } = useTranslation();

  // For non-"on_their_way" tabs, render the original table structure.
  if (activeTab !== 'on_their_way') {
    // Determine if we are on a vendor page (if the first order includes a 'sent_from' field)
    const isVendorPage = orders.length > 0 && Boolean(orders[0].sent_from);
    const partnerHeader = isVendorPage
      ? t('orders_partner_restaurant', { defaultValue: 'Sent From (Restaurant)' })
      : t('orders_partner_vendor', { defaultValue: 'Sent To (Vendor)' });

    const groupedOrders = orders.reduce((acc, order) => {
      const status = getOrderStatus(order);
      if (status === 'on_their_way') {
        const courier = order.courier_name || order.courier_id || t('orders_unassigned');
        if (!acc[courier]) acc[courier] = [];
        acc[courier].push(order);
      } else {
        const groupName = status === 'finished' ? t('orders_finished') : t('orders_accepted');
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(order);
      }
      return acc;
    }, {});

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
            {['accepted', 'on_their_way', 'finished'].map(tab => (
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
        <table className="orders-table">
          <thead>
            <tr>
              {activeTab === 'accepted' && <th>{t('orders_select')}</th>}
              <th>{t('orders_id')}</th>
              <th>{t('orders_customer')}</th>
              <th>{t('orders_address')}</th>
              <th>{t('orders_items')}</th>
              <th>{t('orders_status')}</th>
              <th>{partnerHeader}</th>
              {(activeTab === 'on_their_way' || activeTab === 'finished') && <th>{t('orders_courier')}</th>}
              <th>{t('orders_action')}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedOrders).map(([group, groupOrders]) => (
              <React.Fragment key={group}>
                <tr>
                  {activeTab === 'on_their_way' && group !== t('orders_unassigned') && (
                    <button
                      className="finish-route-button"
                      onClick={() => onFinishRoute(group)}
                    >
                      {t('orders_finish_route')}
                    </button>
                  )}
                </tr>
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
                    isVendorPage={isVendorPage}
                  />
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="add-order-row">
          <button className="add-order-button" onClick={onAddOrder}>
            {t('add_order')}
          </button>
        </div>
      </div>
    );
  }

  // New rendering for the "on_their_way" tab.
  // We assume that the orders prop is a mix of objects with type "deliveryGroup" and "order".
  const deliveryGroups = orders.filter(item => item.type === 'deliveryGroup');
  const orderItems = orders.filter(item => item.type === 'order');

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
          {['accepted', 'on_their_way', 'finished'].map(tab => (
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
      <table className="orders-table">
        <thead>
          <tr>
            <th>{t('orders_id')}</th>
            <th>{t('orders_customer')}</th>
            <th>{t('orders_address')}</th>
            <th>{t('orders_action')}</th>
          </tr>
        </thead>
        <tbody>
          {deliveryGroups.map(group => {
            // Find orders associated with this delivery group using the route order IDs.
            const groupOrderIds = group.route.map(r => r.orderId);
            const groupOrders = orderItems.filter(order => groupOrderIds.includes(order._id));
            return (
              <React.Fragment key={group._id}>
                <tr className="courier-header">
                  <td colSpan="4">
                    <span>{group.courier_name}</span>
                    <button
                      className="finish-delivery-group-button"
                      onClick={() => onFinishDeliveryGroup(group._id)}
                    >
                      {t('orders_finish_route')}
                    </button>
                  </td>
                </tr>
                {groupOrders.map(order => (
                  <tr key={order._id}>
                    <td>{order._id}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.address}</td>
                    <td>
                      <button onClick={() => onFinishOrder(order._id)}>{t('orders_finish_order')}</button>
                      <button onClick={() => onUnassignOrder(order._id)}>{t('orders_unassign_order')}</button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <div className="add-order-row">
        <button className="add-order-button" onClick={onAddOrder}>
          {t('add_order')}
        </button>
      </div>
    </div>
  );
};

export default OrdersTable;
