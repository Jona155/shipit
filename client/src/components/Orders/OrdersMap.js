import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const OrdersMap = ({ orders, activeTab, isSelectingForRoute, selectedOrders, onSelectOrder }) => {
  const filteredOrders = orders.filter(order => order.status === activeTab);

  // Generate colors for couriers
  const courierColors = useMemo(() => {
    const couriers = [...new Set(filteredOrders.map(order => order.courier).filter(Boolean))];
    return generateCourierColors(couriers);
  }, [filteredOrders]);

  const MapAdjuster = () => {
    const map = useMap();
    useEffect(() => {
      map.invalidateSize();
    }, [map]);
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
    if (activeTab === 'On Their Way' && order.courier) {
      return createCustomIcon(courierColors[order.courier]);
    } else if (activeTab === 'Finished') {
      return createCustomIcon('#808080'); // Gray for finished orders
    } else if (activeTab === 'Accepted') {
      return createCustomIcon('#FFA500'); // Orange for accepted orders
    }
    return new L.Icon.Default(); // Default icon as fallback
  };


return (
  <MapContainer center={[40.7128, -74.0060]} zoom={11} style={{ height: '100%', width: '100%' }}>
    <MapAdjuster />
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
    {filteredOrders.map(order => (
      <Marker 
        key={order.id} 
        position={[order.lat, order.lng]}
        icon={getIcon(order)}
        eventHandlers={{
          click: () => handleMarkerClick(order.id),
        }}
        opacity={isSelectingForRoute && !selectedOrders.includes(order.id) ? 0.5 : 1}
      >
        <Popup>
        <div>
                <h3>{order.customer}</h3>
                <p>{order.address}</p>
                <p>Items: {order.items}</p>
                <p>Status: {order.status}</p>
                {order.courier && <p>Courier: {order.courier}</p>}
                {isSelectingForRoute && (
                  <button onClick={() => onSelectOrder(order.id)}>
                    {selectedOrders.includes(order.id) ? 'Deselect' : 'Select'}
                  </button>
                )}
              </div>
        </Popup>
      </Marker>
    ))}
  </MapContainer>
);
};

export default OrdersMap;