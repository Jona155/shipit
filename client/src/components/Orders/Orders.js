
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Orders.css';
import OrdersTable from './OrdersTable';
import OrdersMap from './OrdersMap'; 
import Alert from './Alert';
import OrderForm from './OrderForm';
import CourierAssignment from './CourierAssignment';
import { useTranslation } from 'react-i18next';
import { couriers } from './data';
import { filterOrders, updateOrderStatus, assignCourier } from './orderUtils';

const Orders = () => {
  const { businessId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeTab, setActiveTab] = useState('accepted');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelectingForRoute, setIsSelectingForRoute] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isMapView, setIsMapView] = useState(true);
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === 'he';

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/business/${businessId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        console.log('Fetched orders:', data);
        setOrders(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [businessId]);

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prevSelected => 
      prevSelected.includes(orderId)
        ? prevSelected.filter(id => id !== orderId)
        : [...prevSelected, orderId]
    );
  };

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

  const handleUnassignOrder = (orderId) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === orderId ? { ...order, latest_status: 'accepted', courier: null } : order
      )
    );
    showAlertMessage(t('order_unassigned'));
  };

  const handleFinishOrder = (orderId) => {
    setOrders(updateOrderStatus(orders, orderId, 'finished'));
    showAlertMessage(t('order_finished'));
  };

  const handleFinishRoute = (courier) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.courier === courier && order.latest_status === 'on_their_way'
          ? { ...order, latest_status: 'finished' }
          : order
      )
    );
    showAlertMessage(t('route_orders_finished'));
  };

  const handleReturnToOnTheirWay = (orderId) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === orderId ? { ...order, latest_status: 'on_their_way' } : order
      )
    );
    showAlertMessage(t('order_returned_to_on_their_way'));
  };

  const handleAddOrder = (newOrder) => {
    const order = {
      ...newOrder,
      _id: Date.now().toString(),
      latest_status: 'accepted'
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

  console.log('Current orders state:', orders); // Log the current orders state before rendering

  if (loading) return <div>{t('loading')}</div>;
  if (error) return <div>{t('error')}: {error}</div>;

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
            orders={orders}
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
        businessId={businessId}
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