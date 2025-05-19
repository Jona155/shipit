import React from 'react';
import { useTranslation } from 'react-i18next';
// import OrderCard from './OrderCard'; // Keep for now, remove when fully transitioned
// import VendorOrderCard from './VendorOrderCard'; // Keep for now
import DeliveryGroupsView from './DeliveryGroupsView';
import OrderRow from './OrderRow'; // Import the new OrderRow component
import './OrdersCard.css'; // Styles for header/tabs/etc.
import './OrdersList.css'; // Styles for the new list view
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
  isMapView, // Keep for header button logic
  isSelectingForRoute, // Keep for header button logic
  onBuildRoute,
  onCancelBuildRoute,
  isRTL,
  onOpenAssignModal, // Pass this down if OrderRow needs it
  onSendToTender, // Pass this down
  onCancelTender,
  businessId,
  businessType,
  onApproveTender,
  onDisapproveTender,
  businessSLA, // Pass this down if needed for late status
  onViewTenderStatus,
  onDeleteOrder, // New prop for delete functionality
  isVendor // New prop to determine if user is a vendor
}) => {
  const { t } = useTranslation();

  // Add logging to see what values we have
  console.log('OrdersCards component values:', {
    businessId,
    businessType,
    activeTab,
    isDeliveryGroupsView: activeTab === 'on_their_way',
    ordersLength: orders.length
  });

  // NOTE: Grouping logic might not be needed or might change for the list view
  // For now, we'll just map directly over the orders for the list view.

  return (
    // Container class might need adjustment later
    <div className={`orders-list-container ${isRTL ? 'rtl' : 'ltr'}`}> 
      {/* Header remains similar for now */}
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
        <div className="header-action-buttons">
          {activeTab === 'accepted' && (
            <button 
              className={`add-order-button header-button ${isRTL ? 'rtl' : 'ltr'}`} 
              onClick={onAddOrder}
            >
              {t('add_order')}
            </button>
          )}
          {/* Keep map view buttons if map view is still planned */}
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

      {/* Conditional Rendering: Delivery Groups or Orders List */}
      {activeTab === 'on_their_way' ? (
        <DeliveryGroupsView
          businessId={businessId}
          orders={orders} // Pass all orders for context within DeliveryGroupCard
          onFinishDeliveryGroup={onFinishDeliveryGroup}
          onAbortDeliveryGroup={onAbortDeliveryGroup}
          searchTerm={searchTerm}
          isRTL={isRTL}
          businessType={businessType}
        />
      ) : (
        // Render the new OrderRow component for other tabs
        <div className="orders-list">
          {/* TODO: Implement pagination or virtual scrolling for performance with >50 orders */}
          {orders.map(order => (
            <OrderRow
              key={order._id}
              order={order}
              isRTL={isRTL}
              // Pass necessary props down
              isSelected={selectedOrders.includes(order._id)}
              onSelectOrder={onSelectOrder} 
              businessType={businessType}
              businessId={businessId}
              activeTab={activeTab}
              // Add other handlers as needed by OrderRow actions
              onSendToTender={onSendToTender}
              onViewTenderStatus={onViewTenderStatus}
              onCancelTender={onCancelTender}
              onApproveTender={onApproveTender}
              onDisapproveTender={onDisapproveTender}
              onFinishOrder={onFinishOrder}
              onUnassignOrder={onUnassignOrder}
              onReturnToOnTheirWay={onReturnToOnTheirWay}
              businessSLA={businessSLA}
              onDeleteOrder={onDeleteOrder} // Pass delete handler
              isVendor={isVendor} // Pass vendor flag
            />
          ))}
          {orders.length === 0 && (
             <div className="no-orders-message">{t('no_orders_found')}</div> // Add a message for no orders
          )}
        </div>
      )}

      {/* Keep Assign Courier Button logic for now */}
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