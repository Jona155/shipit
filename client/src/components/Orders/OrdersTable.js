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
  onFinishDeliveryGroup,
  searchTerm,
  setSearchTerm,
  onAddOrder,
  isMapView,
  isSelectingForRoute,
  onBuildRoute,
  onCancelBuildRoute,
  isRTL
}) => {
  const { t } = useTranslation();

  // Determine if we are on a vendor page (if the first order includes a 'sent_from' field)
  const isVendorPage = orders.length > 0 && Boolean(orders[0].sent_from);
  const partnerHeader = isVendorPage
    ? t('orders_partner_restaurant', { defaultValue: 'Sent From (Restaurant)' })
    : t('orders_partner_vendor', { defaultValue: 'Sent To (Vendor)' });

  // Group orders for accepted and finished tabs, but not for on_their_way
  const groupedOrders = orders.reduce((acc, order) => {
    const status = getOrderStatus(order);
    
    if (status === 'on_their_way' && activeTab === 'on_their_way') {
      // For on_their_way tab, don't group - just use a single 'all' group
      if (!acc['all']) acc['all'] = [];
      acc['all'].push(order);
    } else if (status === 'on_their_way') {
      // For orders with on_their_way status but in different tab (like search results)
      const courier = order.courier_name || order.courier_id || t('orders_unassigned');
      if (!acc[courier]) acc[courier] = [];
      acc[courier].push(order);
    } else {
      const groupName = status === 'finished' ? t('finished') : t('accepted');
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(order);
    }
    return acc;
  }, {});

  return (
    <div className={`orders-table-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="orders-table-header">
        <input
          type="text"
          className={`search-input ${isRTL ? 'rtl' : 'ltr'}`}
          placeholder={t('search_orders')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        <div className="tabs">
          {(isRTL 
            ? ['finished', 'on_their_way', 'accepted']
            : ['accepted', 'on_their_way', 'finished']
          ).map(tab => {
            const displayText = t(tab);
            return (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''} ${isRTL ? 'rtl' : 'ltr'}`}
                onClick={() => setActiveTab(tab)}
              >
                {displayText}
              </button>
            );
          })}
        </div>
        {isMapView && (
          <button
            className={`build-route-button ${isSelectingForRoute ? 'cancel' : ''} ${isRTL ? 'rtl' : 'ltr'}`}
            onClick={isSelectingForRoute ? onCancelBuildRoute : onBuildRoute}
          >
            {isSelectingForRoute ? t('cancel_build_route') : t('build_route')}
          </button>
        )}
      </div>
      <table className={`orders-table ${isRTL ? 'rtl' : 'ltr'}`}>
        <thead>
          <tr>
            {activeTab === 'accepted' && <th className={isRTL ? 'rtl' : 'ltr'}>{t('orders_select')}</th>}
            <th className={isRTL ? 'rtl' : 'ltr'}>{t('orders_id')}</th>
            <th className={isRTL ? 'rtl' : 'ltr'}>{t('orders_customer')}</th>
            <th className={isRTL ? 'rtl' : 'ltr'}>{t('orders_address')}</th>
            <th className={isRTL ? 'rtl' : 'ltr'}>{t('orders_items')}</th>
            <th className={isRTL ? 'rtl' : 'ltr'}>{t('orders_status')}</th>
            <th className={isRTL ? 'rtl' : 'ltr'}>{partnerHeader}</th>
            {(activeTab === 'on_their_way' || activeTab === 'finished') && <th className={isRTL ? 'rtl' : 'ltr'}>{t('orders_courier')}</th>}
            <th className={isRTL ? 'rtl' : 'ltr'}>{t('orders_action')}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedOrders).map(([group, groupOrders]) => (
            <React.Fragment key={group}>
              {/* Only show group header if not the 'all' group in on_their_way tab AND not in accepted tab */}
              {(group !== 'all' || activeTab !== 'on_their_way') && activeTab !== 'accepted' && (
                <tr className="group-header">
                  <td colSpan="9" className={isRTL ? 'rtl' : 'ltr'}>
                    <span>{group === 'all' ? '' : group}</span>
                    {activeTab === 'on_their_way' && group !== t('orders_unassigned') && group !== 'all' && (
                      <button
                        className={`finish-route-button ${isRTL ? 'rtl' : 'ltr'}`}
                        onClick={() => onFinishRoute(group)}
                      >
                        {t('orders_finish_route')}
                      </button>
                    )}
                  </td>
                </tr>
              )}
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
                  isRTL={isRTL}
                />
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="add-order-row">
        <button className={`add-order-button ${isRTL ? 'rtl' : 'ltr'}`} onClick={onAddOrder}>
          {t('add_order')}
        </button>
      </div>
    </div>
  );
};

export default OrdersTable;
