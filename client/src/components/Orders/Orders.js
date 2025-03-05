// Orders.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './Orders.css';
import OrdersTable from './OrdersTable';
import OrdersMap from './OrdersMap';
import Alert from './Alert';
import OrderForm from './OrderForm';
import CourierAssignment from './CourierAssignment';
import { useTranslation } from 'react-i18next';
import { getOrderStatus } from "./orderUtils";

const Orders = () => {
  const { businessId } = useParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  // State declarations
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('accepted');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [isSelectingForRoute, setIsSelectingForRoute] = useState(false);
  // New state for view toggle: 'table' or 'map'
  const [activeView, setActiveView] = useState('table');
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Fetch orders from API
  // I want fetch the orders every few seconds. and the query should be optimized, meaning I want to fetch only new orders, and not query for the entire amount of 'ACCEPTED' orders, maybe an anchor could be the timestamp of the last order. however, it will be a bit problametic, with the courier company flow.
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/business/${businessId}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders based on activeTab and search term
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const status = getOrderStatus(order);
      const matchesSearch =
        (order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.address?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.comments_for_order?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        searchTerm === '';
      return status === activeTab && matchesSearch;
    });
  }, [orders, activeTab, searchTerm, updateTrigger]);

  // Action handlers
  const handleSelectOrder = orderId => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: [orderId], status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      const result = await response.json();
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, latest_status: newStatus } : order
        )
      );
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const showAlertMessage = useCallback(message => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  }, []);

  const handleAssignCourier = useCallback(async updatedOrders => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        const updatedOrder = updatedOrders.find(uo => uo._id === order._id);
        return updatedOrder ? { ...order, ...updatedOrder, latest_status: 'ASSIGNED' } : order;
      })
    );
    setSelectedOrders([]);
    setIsSelectingForRoute(false);
    setIsAssignModalOpen(false);
    showAlertMessage(t('orders_assigned_success'));
    setUpdateTrigger(prev => prev + 1);
  }, [t, showAlertMessage]);

  const handleFinishOrder = useCallback(async orderId => {
    try {
      await updateOrderStatus(orderId, 'DELIVERED');
      showAlertMessage(t('order_finished'));
    } catch (err) {
      setError(err.message);
    }
  }, [updateOrderStatus, t, showAlertMessage]);

  const handleReturnToOnTheirWay = useCallback(async orderId => {
    try {
      await updateOrderStatus(orderId, 'COLLECTED');
      showAlertMessage(t('order_returned_to_on_their_way'));
    } catch (err) {
      setError(err.message);
    }
  }, [updateOrderStatus, t, showAlertMessage]);

  const handleUnassignOrder = useCallback(async orderId => {
    try {
      await updateOrderStatus(orderId, 'READY');
      showAlertMessage(t('order_unassigned'));
    } catch (err) {
      setError(err.message);
    }
  }, [updateOrderStatus, t, showAlertMessage]);

  const handleFinishRoute = courier => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.courier === courier && order.latest_status === 'on_their_way'
          ? { ...order, latest_status: 'finished' }
          : order
      )
    );
    showAlertMessage(t('route_orders_finished'));
  };

  const handleAddOrder = newOrder => {
    const order = { ...newOrder, _id: Date.now().toString(), latest_status: 'accepted' };
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

  if (loading) return <div>{t('loading')}</div>;
  if (error) return <div>{t('error')}: {error}</div>;

  return (
    <div className={`orders-container ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Toggle Header */}
      <div className="view-toggle-header">
        <button
          className={`view-toggle-button ${activeView === 'table' ? 'active' : ''}`}
          onClick={() => setActiveView('table')}
        >
          {t('orders_table_view', { defaultValue: 'Table View' })}
        </button>
        <button
          className={`view-toggle-button ${activeView === 'map' ? 'active' : ''}`}
          onClick={() => setActiveView('map')}
        >
          {t('orders_map_view', { defaultValue: 'Map View' })}
        </button>
      </div>

      {/* Render the selected view */}
      {activeView === 'table' && (
        <div className="orders-table-wrapper">
          <OrdersTable
            orders={filteredOrders}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedOrders={selectedOrders}
            onSelectOrder={handleSelectOrder}
            onFinishOrder={handleFinishOrder}
            onUnassignOrder={handleUnassignOrder}
            onReturnToOnTheirWay={handleReturnToOnTheirWay}
            onFinishRoute={handleFinishRoute}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddOrder={() => setShowOrderForm(true)}
            isMapView={activeView === 'map'}
            isSelectingForRoute={isSelectingForRoute}
            onBuildRoute={handleBuildRoute}
            onCancelBuildRoute={handleCancelBuildRoute}
          />
        </div>
      )}
      {activeView === 'map' && (
        <div className="orders-map-wrapper">
          <OrdersMap
            orders={filteredOrders}
            activeTab={activeTab}
            isSelectingForRoute={isSelectingForRoute}
            selectedOrders={selectedOrders}
            onSelectOrder={handleSelectOrder}
          />
        </div>
      )}

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
          <OrderForm onSubmit={handleAddOrder} onClose={() => setShowOrderForm(false)} />
        </div>
      )}
      {showAlert && <Alert message={alertMessage} />}
    </div>
  );
};

export default Orders;
