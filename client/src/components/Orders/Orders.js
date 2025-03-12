// Orders.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const [deliveryGroups, setDeliveryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('accepted');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [isSelectingForRoute, setIsSelectingForRoute] = useState(false);
  const [activeView, setActiveView] = useState('table');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Ref to hold the latest orders for incremental polling
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Define fetchOrders function.
  // When incremental is true, do not set the loading flag.
  const fetchOrders = useCallback(async (incremental = false) => {
    if (!incremental) {
      setLoading(true);
    }
    let url = `${process.env.REACT_APP_API_URL}/api/orders/business/${businessId}`;
    if (incremental && ordersRef.current.length > 0) {
      // Use the timestamp of the most recent order for incremental fetch
      const lastTimestamp = ordersRef.current[0].status[0].timestamp;
      url += `?since=${encodeURIComponent(lastTimestamp)}`;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      if (incremental) {
        // Merge new orders into the existing state (update if needed)
        setOrders(prevOrders => {
          const ordersMap = new Map();
          prevOrders.forEach(order => ordersMap.set(order._id, order));
          data.forEach(order => ordersMap.set(order._id, order));
          return Array.from(ordersMap.values()).sort(
            (a, b) => new Date(b.status[0].timestamp) - new Date(a.status[0].timestamp)
          );
        });
      } else {
        setOrders(data);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!incremental) {
        setLoading(false);
        setInitialLoad(false);
      }
    }
  }, [businessId]);

  // Polling interval: fetch new orders every 5 seconds without interrupting the UI
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 86400000);
    return () => clearInterval(interval);
  }, [businessId, fetchOrders]);

  // Initial fetch of orders
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch delivery groups for "on_their_way" tab
  useEffect(() => {
    async function fetchDeliveryGroups() {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/delivery-group/assigned?bid=${businessId}`);
        if (!response.ok) throw new Error('Failed to fetch delivery groups');
        const data = await response.json();
        setDeliveryGroups(data);
      } catch (err) {
        console.error(err);
      }
    }
    if (activeTab === 'on_their_way') {
      fetchDeliveryGroups();
    }
  }, [businessId, activeTab]);

  // Merge orders and delivery groups for "on_their_way" tab
  const filteredOrders = useMemo(() => {
    let items = orders;
    if (activeTab === 'on_their_way') {
      const ordersWithType = orders.map(o => ({ ...o, type: 'order' }));
      const groupsWithType = deliveryGroups.map(g => ({ ...g, type: 'deliveryGroup' }));
      items = [...ordersWithType, ...groupsWithType];
    }
    return items.filter(item => {
      let status;
      if (item.type === 'deliveryGroup') {
        status = 'on_their_way';
      } else {
        status = getOrderStatus(item);
      }
      const matchesSearch =
        (item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.address?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.comments_for_order?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        searchTerm === '';
      return status === activeTab && matchesSearch;
    });
  }, [orders, deliveryGroups, activeTab, searchTerm]);

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
      if (activeTab === 'finished') {
        await updateOrderStatus(orderId, 'ACCEPTED');
        showAlertMessage(t('order_returned_to_accepted'));
      } else {
        await updateOrderStatus(orderId, 'COLLECTED');
        showAlertMessage(t('order_returned_to_on_their_way'));
      }
    } catch (err) {
      setError(err.message);
    }
  }, [activeTab, updateOrderStatus, t, showAlertMessage]);

  const handleUnassignOrder = useCallback(async orderId => {
    try {
      await updateOrderStatus(orderId, 'READY');
      showAlertMessage(t('order_unassigned'));
    } catch (err) {
      setError(err.message);
    }
  }, [updateOrderStatus, t, showAlertMessage]);

  const handleFinishDeliveryGroup = async (deliveryGroupId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/delivery-group/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_group_id: deliveryGroupId }),
      });
      if (!response.ok) throw new Error('Failed to finish delivery group');
      await response.json();
      showAlertMessage(t('delivery_group_finished'));
      setDeliveryGroups(prev => prev.filter(group => group._id !== deliveryGroupId));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
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

  // During the initial load, show a full-page loader.
  // Once the orders are loaded, incremental updates happen seamlessly.
  if (initialLoad && loading) return <div>{t('loading')}</div>;
  if (error) return <div>{t('error')}: {error}</div>;

  return (
    <div className={`orders-container ${isRTL ? 'rtl' : 'ltr'}`}>
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
            onFinishRoute={handleFinishDeliveryGroup}
            onFinishDeliveryGroup={handleFinishDeliveryGroup}
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
