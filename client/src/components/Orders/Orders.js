import React, { useState } from 'react';
import './Orders.css';
import OrdersTable from './OrdersTable';
import OrdersMap from './OrdersMap'; 
import Alert from './Alert';
import OrderForm from './OrderForm';
import CourierAssignment from './CourierAssignment';
import { useTranslation } from 'react-i18next';
import { initialOrders, couriers } from './data';
import { filterOrders, updateOrderStatus, assignCourier } from './orderUtils';

const Orders = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Accepted');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelectingForRoute, setIsSelectingForRoute] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isMapView, setIsMapView] = useState(true);
  const { t, i18n } = useTranslation();


  const isRTL = i18n.language === 'he';


  // Display an alert message for a short duration
  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  // Toggle selection of an order
  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prevSelected => 
      prevSelected.includes(orderId)
        ? prevSelected.filter(id => id !== orderId)
        : [...prevSelected, orderId]
    );
  };

  // Assign selected orders to a courier
  const handleAssignCourier = (courier) => {
    if (selectedOrders.length === 0 || !courier) {
      alert(t('select_orders_and_courier'));
      return;
    }
    setOrders(assignCourier(orders, selectedOrders, courier));
    setSelectedOrders([]);
    setSelectedCourier('');
    setIsSelectingForRoute(false);
    setIsAssignModalOpen(false);
    showAlertMessage(t('orders_assigned_success'));
  };

  // Unassign a courier from an order
  const handleUnassignOrder = (orderId) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: 'Accepted', courier: null } : order
      )
    );
    showAlertMessage(t('order_unassigned'));
  };

  // Finish an order
  const handleFinishOrder = (orderId) => {
    setOrders(updateOrderStatus(orders, orderId, 'Finished'));
    showAlertMessage(t('order_finished'));
  };

  // Mark all orders for a courier as finished
  const handleFinishRoute = (courier) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.courier === courier && order.status === 'On Their Way'
          ? { ...order, status: 'Finished' }
          : order
      )
    );
    showAlertMessage(t('route_orders_finished'));
  };

    // Return a finished order to 'On Their Way' status
    const handleReturnToOnTheirWay = (orderId) => {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: 'On Their Way' } : order
        )
      );
      showAlertMessage(t('order_returned_to_on_their_way'));
    };

  // Add a new order to the list
  const handleAddOrder = (newOrder) => {
    const order = {
      ...newOrder,
      id: Date.now(),
      status: 'Accepted'
    };
    setOrders([...orders, order]);
    setShowOrderForm(false);
    showAlertMessage(t('order_added_success'));
  };

  const handleBuildRoute = () => {
    setIsSelectingForRoute(true);
    setSelectedOrders([]);
  };

  const handleCancelBuildRoute = () => {
    setIsSelectingForRoute(false);
    setSelectedOrders([]);
  };

  return (
    <div className={`orders-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="split-view">
        <div className="table-view">
        <OrdersTable 
            orders={orders}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedOrders={selectedOrders}
            onSelectOrder={handleSelectOrder}
            onFinishOrder={handleFinishOrder}
            onFinishRoute={handleFinishRoute}
            onUnassignOrder={handleUnassignOrder}
            onReturnToOnTheirWay={handleReturnToOnTheirWay}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddOrder={() => setShowOrderForm(true)}
            isMapView={isMapView}
            isSelectingForRoute={isSelectingForRoute}
            onBuildRoute={handleBuildRoute}
            onCancelBuildRoute={handleCancelBuildRoute}
          />
        </div>
        <div className="map-view">
          <OrdersMap
            orders={filterOrders(orders, searchTerm)}
            activeTab={activeTab}
            isSelectingForRoute={isSelectingForRoute}
            selectedOrders={selectedOrders}
            onSelectOrder={handleSelectOrder}
          />
        </div>
      </div>
      <button onClick={() => setIsAssignModalOpen(true)} className="assign-courier-button">
        {t('assign_courier')}
      </button>
      <CourierAssignment
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedOrders={selectedOrders}
        onAssignCourier={handleAssignCourier}
        couriers={couriers}
        orders={orders}
        selectedCourier={selectedCourier}
        setSelectedCourier={setSelectedCourier}
      />
      {showOrderForm && (
        <div className="side-panel visible">
          <OrderForm 
            onSubmit={handleAddOrder}
            onClose={() => setShowOrderForm(false)}
          />
        </div>
      )}
      {showAlert && <Alert message={alertMessage} />}
    </div>
  );
};

export default Orders;