import React from 'react';
import { useTranslation } from 'react-i18next';
import OrderCard from './OrderCard';
import VendorOrderCard from './VendorOrderCard';
import DeliveryGroupsView from './DeliveryGroupsView';
import './OrdersCard.css';
import { getOrderStatus } from "./orderUtils";

const OrdersCards = ({ 
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
  onAbortDeliveryGroup,
  searchTerm,
  setSearchTerm,
  onAddOrder,
  isMapView,
  isSelectingForRoute,
  onBuildRoute,
  onCancelBuildRoute,
  isRTL,
  onOpenAssignModal,
  onSendToTender,
  onCancelTender,
  businessId,
  businessType,
  onApproveTender,
  onDisapproveTender,
  businessSLA,
  onViewTenderStatus
}) => {
  const { t } = useTranslation();

  // Determine if we are on a vendor page (if the first order includes a 'sent_from' field)
  const isVendorPage = orders.length > 0 && Boolean(orders[0].sent_from);

  // Add logging to see what values we have
  console.log('OrdersCards component values:', {
    businessId,
    businessType,
    activeTab,
    isDeliveryGroupsView: activeTab === 'on_their_way',
    ordersLength: orders.length
  });

  // Group orders for accepted and finished tabs, but not for on_their_way
  const groupedOrders = orders.reduce((acc, order) => {
    const status = getOrderStatus(order);
    
    if (status === 'on_their_way' && activeTab === 'on_their_way') {
      // For on_their_way tab, we're using DeliveryGroupsView, so we don't need to group these
      if (!acc['__skip__']) acc['__skip__'] = [];
      acc['__skip__'].push(order);
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
    <div className={`orders-card-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="orders-card-header">
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
            ? ['accepted', 'on_their_way', 'finished']
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
        {/* New container for action buttons */}
        <div className="header-action-buttons">
          {activeTab === 'accepted' && (
            <button 
              className={`add-order-button header-button ${isRTL ? 'rtl' : 'ltr'}`} 
              onClick={onAddOrder}
            >
              {t('add_order')}
            </button>
          )}
          {isMapView && (
            <button
              className={`build-route-button header-button ${isSelectingForRoute ? 'cancel' : ''} ${isRTL ? 'rtl' : 'ltr'}`}
              onClick={isSelectingForRoute ? onCancelBuildRoute : onBuildRoute}
            >
              {isSelectingForRoute ? t('cancel_build_route') : t('build_route')}
            </button>
          )}
        </div>
      </div>

      {/* For on_their_way tab, use the DeliveryGroupsView instead of cards */}
      {activeTab === 'on_their_way' ? (
        <DeliveryGroupsView
          businessId={businessId}
          orders={orders}
          onFinishDeliveryGroup={onFinishDeliveryGroup}
          onAbortDeliveryGroup={onAbortDeliveryGroup}
          searchTerm={searchTerm}
          isRTL={isRTL}
          businessType={businessType}
        />
      ) : (
        <div className="cards-grid">
          {Object.entries(groupedOrders).map(([group, groupOrders]) => {
            // Skip the internal __skip__ group used for on_their_way orders
            if (group === '__skip__') return null;
            
            return (
              <React.Fragment key={group}>
                {/* Only show group header if not in accepted tab */}
                {activeTab !== 'accepted' && (
                  <div className="group-header">
                    <div className="group-name">{group === 'all' ? '' : group}</div>
                  </div>
                )}
                {groupOrders.map(order => (
                  businessType === 'vendor' ? (
                    <VendorOrderCard
                      key={order._id}
                      order={order}
                      onApproveTender={onApproveTender}
                      onDisapproveTender={onDisapproveTender}
                      businessSLA={businessSLA}
                      isRTL={isRTL}
                      businessId={businessId}
                      isSelected={selectedOrders.includes(order._id)}
                      onSelectOrder={onSelectOrder}
                    />
                  ) : (
                    <OrderCard
                      key={order._id}
                      order={order}
                      activeTab={activeTab}
                      isSelected={selectedOrders.includes(order._id)}
                      onSelectOrder={onSelectOrder}
                      onFinishOrder={onFinishOrder}
                      onUnassignOrder={onUnassignOrder}
                      onReturnToOnTheirWay={onReturnToOnTheirWay}
                      onSendToTender={onSendToTender}
                      onViewTenderStatus={onViewTenderStatus}
                      onCancelTender={onCancelTender}
                      isRTL={isRTL}
                      businessSLA={businessSLA}
                    />
                  )
                ))}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Assign Courier Button - Show on accepted tab for BOTH business types when not in map view */}
      {activeTab === 'accepted' && !isMapView && (
        <div className="assign-courier-fixed-container">
          <button 
            className="assign-courier-button" 
            onClick={onOpenAssignModal} 
            disabled={selectedOrders.length === 0}
            title={selectedOrders.length === 0 ? t('select_orders_to_assign_tooltip', 'Select orders first') : t('assign_courier')}
          >
            {t('assign_courier')}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersCards; 