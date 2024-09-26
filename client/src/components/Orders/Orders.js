
import React, {useState, useEffect, useMemo, useCallback} from 'react';
import { useParams } from 'react-router-dom';
import './Orders.css';
import OrdersTable from './OrdersTable';
import OrdersMap from './OrdersMap'; 
import Alert from './Alert';
import OrderForm from './OrderForm';
import CourierAssignment from './CourierAssignment';
import { useTranslation } from 'react-i18next';
import {filterOrders, getOrderStatus} from "./orderUtils";

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
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const isRTL = i18n.language === 'he';

  const fetchOrders = useCallback(async () => {
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
  }, [businessId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    console.log('Filtering orders. Total orders:', orders.length);
    console.log('Active tab:', activeTab);
    console.log('Search term:', searchTerm);

    return orders.filter(order => {
      const status = getOrderStatus(order);
      const matchesSearch =
        (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.address && order.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.comments_for_order && order.comments_for_order.toLowerCase().includes(searchTerm.toLowerCase())) ||
        searchTerm === '';

      console.log('Order:', order._id, 'Status:', status, 'Matches search:', matchesSearch, 'Matches tab:', status === activeTab);

      return status === activeTab && matchesSearch;
    });
  }, [orders, activeTab, searchTerm, updateTrigger]);

 const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_ids: [orderId],
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const result = await response.json();
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, latest_status: newStatus } : order
        )
      );
      return result;
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  }, []);

  const showAlertMessage = useCallback((message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  }, []);

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prevSelected =>
      prevSelected.includes(orderId)
        ? prevSelected.filter(id => id !== orderId)
        : [...prevSelected, orderId]
    );
  };

  const handleAssignCourier = useCallback(async (updatedOrders) => {
  console.log('Updated orders received:', updatedOrders);
  setOrders(prevOrders => {
    const newOrders = prevOrders.map(order => {
      const updatedOrder = updatedOrders.find(uo => uo._id === order._id);
      if (updatedOrder) {
        console.log('Updating order:', order._id, 'with courier:', updatedOrder.courier_name);
        return {
          ...order,
          ...updatedOrder,
          latest_status: 'ASSIGNED',
        };
      }
      return order;
    });
    console.log('New orders state:', newOrders);
    return newOrders;
  });
  setSelectedOrders([]);
  setIsSelectingForRoute(false);
  setIsAssignModalOpen(false);
  showAlertMessage(t('orders_assigned_success'));
  setUpdateTrigger(prev => prev + 1);
}, [t]);

  const handleFinishOrder = useCallback(async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'DELIVERED');
      showAlertMessage(t('order_finished'));
    } catch (err) {
      setError(err.message);
    }
  }, [updateOrderStatus, t]);

  const handleReturnToOnTheirWay = useCallback(async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'COLLECTED');
      showAlertMessage(t('order_returned_to_on_their_way'));
    } catch (err) {
      setError(err.message);
    }
  }, [updateOrderStatus, t]);

    const handleUnassignOrder = useCallback(async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'READY');
      showAlertMessage(t('order_unassigned'));
    } catch (err) {
      setError(err.message);
    }
  }, [updateOrderStatus, t]);

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
            orders={filteredOrders}
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
            orders={filteredOrders}
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