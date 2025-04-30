import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './Orders.css';
import OrdersCards from './OrdersCards';
import OrdersMap from './OrdersMap';
import Alert from './Alert';
import OrderForm from './OrderForm';
import CourierAssignment from './CourierAssignment';
import TenderModal from './TenderModal';
import TenderStatusModal from './TenderStatusModal';
import Loading from '../common/Loading';
import { useTranslation } from 'react-i18next';
import { getOrderStatus } from "./orderUtils";
import axios from 'axios';
import '../common/styles.css';

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
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [isTenderStatusModalOpen, setIsTenderStatusModalOpen] = useState(false);
  const [selectedOrderForTender, setSelectedOrderForTender] = useState(null);
  const [selectedOrderForTenderStatus, setSelectedOrderForTenderStatus] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [isSelectingForRoute, setIsSelectingForRoute] = useState(false);
  const [activeView, setActiveView] = useState('table');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [businessSettings, setBusinessSettings] = useState(null);

  // Ref to hold the latest orders for incremental polling
  const businessType = localStorage.getItem('currentBusinessType');
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Define fetchOrders function.
  // When incremental is true, do not set the loading flag.
  const fetchOrders = useCallback(
    async (incremental = false) => {
      if (!incremental) {
        setLoading(true);
      }
      // Make sure the API URL is clean - strip trailing slashes and default to relative URL if missing
      const apiBaseUrl = process.env.REACT_APP_API_URL 
        ? process.env.REACT_APP_API_URL.replace(/\/+$/, '') // Remove trailing slashes
        : ''; // Default to relative URL if env var is not set
      
      let url = `${apiBaseUrl}/api/orders/business/${businessId}?status=${activeTab}`;
      
      // If business type is vendor, change the endpoint
      if (businessType === 'vendor') {
        url = `${apiBaseUrl}/api/orders/vendor/${businessId}?status=${activeTab}`;
      }
      
      // Debug log the URL
      console.log("Fetching orders from URL:", url);
      console.log("Business type:", businessType);
      console.log("Business ID:", businessId);
      
      if (incremental && ordersRef.current.length > 0) {
        // Use the timestamp of the most recent order for incremental fetch
        const lastTimestamp = ordersRef.current[0].status[0].timestamp;
        url += `&since=${encodeURIComponent(lastTimestamp)}`;
      }
      
      try {
        const response = await fetch(url);
        // Log response status before trying to parse JSON
        console.log("Response status:", response.status, response.statusText);
        
        // Check if response is ok before parsing
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        // Try to parse as JSON, catch and log the full response text if it fails
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          // Get the raw text to see what we actually received
          const textResponse = await response.text();
          console.error("JSON parsing failed. Raw response:", textResponse.substring(0, 500) + "...");
          
          // If we're in vendor mode, try again with a direct relative URL as fallback
          if (businessType === 'vendor' && apiBaseUrl) {
            console.log("Trying fallback with relative URL...");
            const fallbackUrl = `/api/orders/vendor/${businessId}?status=${activeTab}`;
            try {
              const fallbackResponse = await fetch(fallbackUrl);
              console.log("Fallback response status:", fallbackResponse.status);
              if (fallbackResponse.ok) {
                data = await fallbackResponse.json();
                console.log("Fallback request successful!");
              } else {
                throw new Error(`Fallback request failed with status ${fallbackResponse.status}`);
              }
            } catch (fallbackError) {
              console.error("Fallback request also failed:", fallbackError);
              throw new Error(`Failed to parse response as JSON: ${jsonError.message}`);
            }
          } else {
            throw new Error(`Failed to parse response as JSON: ${jsonError.message}`);
          }
        }
        
        if (incremental) {
          // Merge new orders into the existing state (update if needed)
          setOrders(prevOrders => {
            const ordersMap = new Map();
            prevOrders.forEach(order => ordersMap.set(order._id, order));
            data.forEach(order => ordersMap.set(order._id, order));
            return Array.from(ordersMap.values()).sort(
              (a, b) =>
                new Date(b.status[0].timestamp) - new Date(a.status[0].timestamp)
            );
          });
        } else {
          setOrders(data);
        }
        setError(null);

        // Only fetch delivery groups if we're not on the on_their_way tab
        if (activeTab !== 'on_their_way') {
          const deliveryGroupsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/delivery-group/assigned?bid=${businessId}`);
          if (!deliveryGroupsResponse.ok) throw new Error('Failed to fetch delivery groups');
          const deliveryGroupsData = await deliveryGroupsResponse.json();
          setDeliveryGroups(deliveryGroupsData);
        } else {
          setDeliveryGroups([]); // Clear delivery groups when on on_their_way tab
        }
      } catch (err) {
        console.error(`Error fetching orders: ${err.message}`);
        setError(err.message);
      } finally {
        if (!incremental) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    },
    [businessId, activeTab]
  );

  // Polling interval (example: once per day)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [businessId, fetchOrders]);

  // Add a clear tab effect to completely reset the orders list when the tab changes
  useEffect(() => {
    setOrders([]);  // Clear existing orders
    setLoading(true);
    fetchOrders();
  }, [activeTab, fetchOrders]);

  // Merge orders and delivery groups for "on_their_way" tab
  const filteredOrders = useMemo(() => {
    let items = orders;
    if (activeTab === 'on_their_way') {
      // For on_their_way tab, only use orders
      items = orders.map(o => ({ ...o, type: 'order' }));
    } else {
      // For other tabs, include both orders and delivery groups
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
        (item.customer_phone_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const updateOrderStatus = useCallback(
    async (orderId, newStatus) => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/orders/update-status`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_ids: [orderId], status: newStatus })
          }
        );
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
    },
    []
  );

  const showAlertMessage = useCallback((message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  }, []);

  const handleAssignCourier = useCallback(
    async updatedOrders => {
      // When orders are assigned, they should move to on_their_way tab
      setOrders(prevOrders => {
        const newOrders = prevOrders.map(order => {
          const updatedOrder = updatedOrders.find(uo => uo._id === order._id);
          if (updatedOrder) {
            return {
              ...order,
              ...updatedOrder,
              latest_status: 'ASSIGNED',
              status: [
                {
                  value: 'ASSIGNED',
                  timestamp: new Date().toISOString(),
                  courier_id: updatedOrder.courier_id,
                  courier_name: updatedOrder.courier_name
                },
                ...order.status
              ]
            };
          }
          return order;
        });
        return newOrders;
      });
      
      setSelectedOrders([]);
      setIsSelectingForRoute(false);
      setIsAssignModalOpen(false);
      showAlertMessage(t('orders_assigned_success'), 'success');
      
      // Refresh orders without changing tabs
      setTimeout(() => {
        fetchOrders();
      }, 300);
    },
    [t, showAlertMessage, fetchOrders]
  );

  const handleFinishOrder = useCallback(
    async orderId => {
      try {
        await updateOrderStatus(orderId, 'DELIVERED');
        showAlertMessage(t('order_finished'), 'success');
      } catch (err) {
        setError(err.message);
        showAlertMessage(err.message, 'error');
      }
    },
    [updateOrderStatus, t, showAlertMessage]
  );

  const handleReturnToOnTheirWay = useCallback(
    async orderId => {
      try {
        if (activeTab === 'finished') {
          await updateOrderStatus(orderId, 'ACCEPTED');
          showAlertMessage(t('order_returned_to_accepted'), 'success');
        } else {
          await updateOrderStatus(orderId, 'COLLECTED');
          showAlertMessage(t('order_returned_to_on_their_way'), 'success');
        }
      } catch (err) {
        setError(err.message);
        showAlertMessage(err.message, 'error');
      }
    },
    [activeTab, updateOrderStatus, t, showAlertMessage]
  );

  const handleUnassignOrder = useCallback(
    async orderId => {
      try {
        await updateOrderStatus(orderId, 'READY');
        showAlertMessage(t('order_unassigned'), 'success');
      } catch (err) {
        setError(err.message);
        showAlertMessage(err.message, 'error');
      }
    },
    [updateOrderStatus, t, showAlertMessage]
  );

  const handleFinishDeliveryGroup = async deliveryGroupId => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/delivery-group/finish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delivery_group_id: deliveryGroupId })
        }
      );
      if (!response.ok) throw new Error('Failed to finish delivery group');
      await response.json();
      showAlertMessage(t('delivery_group_finished'), 'success');
      setDeliveryGroups(prev => prev.filter(group => group._id !== deliveryGroupId));
    } catch (err) {
      console.error(err);
      setError(err.message);
      showAlertMessage(err.message, 'error');
    }
  };

  const handleAbortDeliveryGroup = async deliveryGroupId => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/delivery-group/abort`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            delivery_group_id: deliveryGroupId,
            business_id: businessId
          })
        }
      );
      
      if (!response.ok) {
        // Parse error response
        const errorData = await response.json().catch(() => ({
          error: 'Failed to abort delivery group'
        }));
        throw new Error(errorData.error || 'Failed to abort delivery group');
      }
      
      await response.json();
      showAlertMessage(t('delivery_group_aborted', 'Delivery group assignment cancelled'), 'info');
      
      // Remove the aborted delivery group from the state
      setDeliveryGroups(prev => prev.filter(group => group._id !== deliveryGroupId));
      
      // Refresh orders to show the updated statuses
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError(err.message);
      showAlertMessage(err.message, 'error');
    }
  };

  // Updated: Now actually posts the new order to /api/orders
  const handleAddOrder = async newOrder => {
    // Validate location & place_id
    if (!newOrder.location || !newOrder.place_id) {
      setError('Location and place_id are required for new orders.');
      showAlertMessage(t('location_place_id_required'), 'error');
      return;
    }

    try {
      // Attach business ID and source
      newOrder.bid = businessId;
      newOrder.source = 'SHIPIT_WEB';

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const createdOrder = await response.json();
      // Update local state
      setOrders(prev => [...prev, createdOrder]);
      setShowOrderForm(false);
      showAlertMessage(t('order_added_success'), 'success');

      // Instead of adding createdOrder manually:
      await fetchOrders();
    } catch (err) {
      setError(err.message);
      showAlertMessage(err.message, 'error');
    }
  };

  const handleBuildRoute = () => {
    setIsSelectingForRoute(true);
    setSelectedOrders([]);
  };

  const handleCancelBuildRoute = () => {
    setIsSelectingForRoute(false);
    setSelectedOrders([]);
  };

  // New function to fetch business settings
  const fetchBusinessSettings = useCallback(async () => {
    try {
      // First, try to get the business data from localStorage
      const storedSLA = localStorage.getItem('currentBusinessSLA');
      
      if (storedSLA) {
        setBusinessSettings({
          sla: parseInt(storedSLA, 10) || 30 // Use stored SLA or default
        });
      } else {
        // Fall back to API call if localStorage data isn't available
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/businesses/${businessId}`);
        if (!response.ok) throw new Error('Failed to fetch business settings');
        const businessData = await response.json();
        
        setBusinessSettings({
          sla: businessData.sla || 30 // Default to 30 minutes if not set
        });
      }
    } catch (err) {
      console.error('Error fetching business settings:', err);
      // Set default values if fetch fails
      setBusinessSettings({ sla: 30 });
    }
  }, [businessId]);

  // Add fetchBusinessSettings to initial load
  useEffect(() => {
    fetchOrders();
    fetchBusinessSettings();
  }, [fetchOrders, fetchBusinessSettings]);

  // Add handler for opening the tender modal
  const handleOpenTenderModal = useCallback((orderId) => {
    setSelectedOrderForTender(orderId);
    setIsTenderModalOpen(true);
  }, []);
  
  // Add handler for viewing tender status
  const handleViewTenderStatus = useCallback((orderId, orderDetails) => {
    setSelectedOrderForTenderStatus(orderId);
    setSelectedOrderDetails(orderDetails);
    setIsTenderStatusModalOpen(true);
  }, []);
  
  // Add handler for sending an order to tender
  const handleSendToTender = useCallback(async (orderId, vendorIds) => {
    try {
      const token = localStorage.getItem('authToken');
      // Clean up the API URL to ensure it's correct
      let apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      // Remove any trailing special characters
      apiBaseUrl = apiBaseUrl.replace(/[%\s]+$/, '');
      
      // Log the request for debugging
      console.log("Sending order to tender:", { orderId, vendorIds });
      
      const response = await fetch(
        `${apiBaseUrl}/api/orders/tender`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'authToken': token 
          },
          body: JSON.stringify({ 
            order_id: orderId, 
            vendor_ids: vendorIds // These will be used as vendor_bid values in the backend
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send order to tender');
      }
      
      const result = await response.json();
      console.log("Tender response:", result);
      
      // Update the order in state with tender information
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId 
            ? { 
                ...order, 
                tender_scope: result.updated_order.tender_scope, // This should now contain vendor_bid instead of vendor_id
                in_tender: true,
                selected_vendor: null
              } 
            : order
        )
      );
      
      showAlertMessage(
        t('tender_sent_success', { count: vendorIds.length }),
        'success'
      );
      
      return result;
    } catch (err) {
      console.error('Error sending to tender:', err);
      showAlertMessage(err.message, 'error');
      throw err;
    }
  }, [t, showAlertMessage]);

  // Add handler for cancelling a tender
  const handleCancelTender = useCallback(async (orderId) => {
    try {
      const token = localStorage.getItem('authToken');
      let apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      apiBaseUrl = apiBaseUrl.replace(/[%\s]+$/, ''); // Clean URL

      const response = await fetch(
        `${apiBaseUrl}/api/orders/cancel-tender`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'authToken': token 
          },
          body: JSON.stringify({ order_id: orderId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel tender');
      }

      const result = await response.json();

      // Update the order in state to reflect cancellation
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId 
            ? { 
                ...order, 
                in_tender: false,
                tender_scope: undefined, // Clear tender scope
                selected_vendor: undefined // Clear selected vendor
              } 
            : order
        )
      );

      showAlertMessage(t('tender_cancelled_success'), 'info');
      return result;
    } catch (err) {
      console.error('Error cancelling tender:', err);
      showAlertMessage(err.message, 'error');
      throw err;
    }
  }, [t, showAlertMessage]);

  // Handle closing the tender status modal with possible refresh
  const handleCloseTenderStatusModal = useCallback((shouldRefresh = false) => {
    setIsTenderStatusModalOpen(false);
    if (shouldRefresh) {
      fetchOrders();
    }
  }, [fetchOrders]);

  // Handlers for Vendor Tender Response
  const handleTenderResponse = useCallback(async (orderId, responseStatus) => {
      if (!businessId) {
          showAlertMessage('Business ID not available', 'error');
          return;
      }
      
      if (responseStatus !== 'APPROVED' && responseStatus !== 'DISAPPROVED') {
          showAlertMessage('Invalid tender response status', 'error');
          return;
      }

      try {
          const token = localStorage.getItem('authToken');
          let apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
          apiBaseUrl = apiBaseUrl.replace(/[%\s]+$/, '');

          const response = await fetch(
              `${apiBaseUrl}/api/orders/tender-response`,
              {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'authToken': token
                  },
                  body: JSON.stringify({
                      order_id: orderId,
                      vendor_id: businessId, // Use the current businessId as vendor_id
                      response_status: responseStatus
                  })
              }
          );

          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to submit tender response');
          }

          const result = await response.json();

          // Update local state - specifically the my_tender_status
          setOrders(prevOrders =>
              prevOrders.map(order =>
                  order._id === orderId
                      ? { ...order, my_tender_status: responseStatus }
                      : order
              )
          );

          showAlertMessage(
              responseStatus === 'APPROVED' ? t('tender_approved_success') : t('tender_disapproved_success'),
              'success'
          );
          return result;
      } catch (err) {
          console.error('Error submitting tender response:', err);
          showAlertMessage(err.message, 'error');
          throw err;
      }
  }, [businessId, t, showAlertMessage]);

  const handleApproveTender = (orderId) => handleTenderResponse(orderId, 'APPROVED');
  const handleDisapproveTender = (orderId) => handleTenderResponse(orderId, 'DISAPPROVED');

  // During the initial load, show a full-page loader.
  // Once the orders are loaded, incremental updates happen seamlessly.
  if (initialLoad && loading) return <Loading size="fullscreen" />;
  if (error) return <div className="error-message">{t('error')}: {error}</div>;

  // Debug information for understanding the issue
  console.log('Orders component values:', {
    businessId,
    businessType,
    activeTab,
    isUsingDeliveryGroups: activeTab === 'on_their_way',
    orderCount: filteredOrders.length
  });

  return (
    <div className={`orders-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="view-toggle-header">
        <button
          className={`view-toggle-button ${activeView === 'table' ? 'active' : ''}`}
          onClick={() => setActiveView('table')}
        >
          {t('switch_to_cards')}
        </button>
        <button
          className={`view-toggle-button ${activeView === 'map' ? 'active' : ''}`}
          onClick={() => setActiveView('map')}
        >
          {t('switch_to_map')}
        </button>
      </div>
      {activeView === 'table' && (
        <div className="orders-table-wrapper">
          <OrdersCards
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
            onAbortDeliveryGroup={handleAbortDeliveryGroup}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddOrder={() => setShowOrderForm(true)}
            isMapView={activeView === 'map'}
            isSelectingForRoute={isSelectingForRoute}
            onBuildRoute={handleBuildRoute}
            onCancelBuildRoute={handleCancelBuildRoute}
            isRTL={isRTL}
            onOpenAssignModal={() => setIsAssignModalOpen(true)}
            onSendToTender={handleOpenTenderModal}
            onViewTenderStatus={handleViewTenderStatus}
            onCancelTender={handleCancelTender}
            onApproveTender={handleApproveTender}
            onDisapproveTender={handleDisapproveTender}
            businessId={businessId}
            businessType={businessType}
            businessSLA={businessSettings?.sla}
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
            onFinishOrder={handleFinishOrder}
            onUnassignOrder={handleUnassignOrder}
            onReturnToOnTheirWay={handleReturnToOnTheirWay}
            onFinishRoute={handleFinishDeliveryGroup}
            onFinishDeliveryGroup={handleFinishDeliveryGroup}
            onAbortDeliveryGroup={handleAbortDeliveryGroup}
            isMapView={true}
            isRTL={isRTL}
            onBuildRoute={handleBuildRoute}
            onCancelBuildRoute={handleCancelBuildRoute}
            businessSLA={businessSettings?.sla}
          />
          
          {/* Assign Courier Button for map view - only shown on the accepted tab */}
          {activeTab === 'accepted' && (
            <div className="assign-courier-fixed-container">
              <button 
                className="assign-courier-button" 
                onClick={() => setIsAssignModalOpen(true)}
              >
                {t('assign_courier')}
              </button>
            </div>
          )}
        </div>
      )}
      <CourierAssignment
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedOrders={selectedOrders}
        onAssignCourier={handleAssignCourier}
        orders={orders}
        selectedCourier={selectedCourier}
        setSelectedCourier={setSelectedCourier}
        businessId={businessId}
        showAlertMessage={showAlertMessage}
      />
      {showOrderForm && (
        <div className="side-panel visible">
          <OrderForm onSubmit={handleAddOrder} onClose={() => setShowOrderForm(false)} />
        </div>
      )}
      {showAlert && <Alert message={alertMessage} type={alertType} />}
      <TenderModal
        isOpen={isTenderModalOpen}
        onClose={() => setIsTenderModalOpen(false)}
        orderId={selectedOrderForTender}
        businessId={businessId}
        onSendTender={handleSendToTender}
      />
      <TenderStatusModal
        isOpen={isTenderStatusModalOpen}
        onClose={handleCloseTenderStatusModal}
        orderId={selectedOrderForTenderStatus}
        orderDetails={selectedOrderDetails}
        businessId={businessId}
      />
    </div>
  );
};

export default Orders;
