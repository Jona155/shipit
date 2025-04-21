import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import './OrdersMap.css';
import { getOrderStatus } from "./orderUtils";
import SLATimer from './SLATimer';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Function to generate distinct colors for couriers
const generateCourierColors = (couriers) => {
  const colors = [
    '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
  ];
  
  const courierColors = {};
  couriers.forEach((courier, index) => {
    courierColors[courier] = colors[index % colors.length];
  });
  
  return courierColors;
};

const OrdersMap = ({
  orders,
  activeTab,
  isSelectingForRoute,
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
  isRTL,
  onBuildRoute,
  onCancelBuildRoute,
  businessSLA
}) => {
  const { t } = useTranslation();

  const filteredOrders = orders.filter(order => getOrderStatus(order) === activeTab);

  // Generate colors for couriers
  const courierColors = useMemo(() => {
    const couriers = [...new Set(filteredOrders.map(order => order.courier_name || order.courier_id).filter(Boolean))];
    return generateCourierColors(couriers);
  }, [filteredOrders]);

  const MapAdjuster = () => {
    const map = useMap();
    useEffect(() => {
      map.invalidateSize();
      if (filteredOrders.length > 0) {
        const bounds = L.latLngBounds(filteredOrders.map(order => [order.location.lat, order.location.lng]));
        map.fitBounds(bounds);
      }
    }, [map, filteredOrders]);
    return null;
  };

  const handleMarkerClick = (orderId) => {
    if (isSelectingForRoute) {
      onSelectOrder(orderId);
    }
  };

  // Create a custom icon for each courier or status
  const createCustomIcon = (color) => {
    return new L.Icon({
      iconUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><path fill="${encodeURIComponent(color)}" d="M16 0c-5.523 0-10 4.477-10 10 0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10z"/></svg>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  // Get appropriate icon based on order status and courier
  const getIcon = (order) => {
    const status = getOrderStatus(order);
    const courierIdentifier = order.courier_name || order.courier_id;
    
    if (status === 'on_their_way' && courierIdentifier) {
      return createCustomIcon(courierColors[courierIdentifier]);
    } else if (status === 'finished') {
      return createCustomIcon('#808080'); // Gray for finished orders
    } else if (status === 'accepted') {
      return createCustomIcon('#FFA500'); // Orange for accepted orders
    }
    return new L.Icon.Default(); // Default icon as fallback
  };

  return (
    <div className={`orders-map ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="map-controls">
        {activeTab === 'accepted' && onBuildRoute && (
          <button
            className={`build-route-button ${isSelectingForRoute ? 'cancel' : ''} ${isRTL ? 'rtl' : 'ltr'}`}
            onClick={isSelectingForRoute ? onCancelBuildRoute : onBuildRoute}
          >
            {isSelectingForRoute ? t('cancel_build_route') : t('build_route')}
          </button>
        )}
      </div>
      
      <MapContainer center={[31.7767, 35.2345]} zoom={7} style={{ height: '100%', width: '100%' }}>
        <MapAdjuster />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredOrders.map(order => (
          order.location && order.location.lat && order.location.lng ? (
            <Marker 
              key={order._id} 
              position={[order.location.lat, order.location.lng]}
              icon={getIcon(order)}
              eventHandlers={{
                click: () => handleMarkerClick(order._id),
              }}
              opacity={isSelectingForRoute && !selectedOrders.includes(order._id) ? 0.5 : 1}
            >
              <Popup>
                <div>
                  <h3>{order.customer_name}</h3>
                  <p>{order.address}</p>
                  <p>{t('order_items')}: {order.comments_for_order}</p>
                  <p>{t('order_status')}: {t(`order_status_${getOrderStatus(order)}`)}</p>
                  {order.courier_name && <p>{t('order_courier')}: {order.courier_name}</p>}
                  
                  {businessSLA && order.status && order.status.length > 0 && (
                    <div className="popup-sla-timer">
                      <p>{t('order_sla') || 'SLA'}:</p>
                      <div className="timer-container">
                        <SLATimer 
                          orderTime={(() => {
                            // Create a date object from the timestamp
                            const utcDate = new Date(order.status[order.status.length - 1].timestamp);
                            
                            // Add 3 hours to adjust for Israel timezone (UTC+3)
                            const israelDate = new Date(utcDate.getTime() + (3 * 60 * 60 * 1000));
                            
                            return israelDate.toISOString();
                          })()} 
                          slaMinutes={businessSLA} 
                        />
                      </div>
                    </div>
                  )}
                  
                  {isSelectingForRoute && (
                    <button onClick={() => onSelectOrder(order._id)}>
                      {selectedOrders.includes(order._id) ? t('deselect') : t('select')}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
};

export default OrdersMap;