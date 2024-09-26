// export const filterOrders = (orders, searchTerm) => {
//     return orders.filter(order => 
//       order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       order.address.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   };
  
//   export const updateOrderStatus = (orders, orderId, newStatus) => {
//     return orders.map(order =>
//       order.id === orderId ? { ...order, status: newStatus } : order
//     );
//   };
  
//   export const assignCourier = (orders, selectedOrders, selectedCourier) => {
//     return orders.map(order => 
//       selectedOrders.includes(order.id)
//         ? { ...order, status: 'On Their Way', courier: selectedCourier }
//         : order
//     );
//   };

// export const filterOrders = (orders, searchTerm) => {
//   if (!Array.isArray(orders)) return [];
//
//   return orders.filter(order => {
//     const customerName = order.customer_name || '';
//     const address = order.address || '';
//     const comments = order.comments_for_order || '';
//     const searchTermLower = searchTerm.toLowerCase();
//
//     return (
//       customerName.toLowerCase().includes(searchTermLower) ||
//       address.toLowerCase().includes(searchTermLower) ||
//       comments.toLowerCase().includes(searchTermLower)
//     );
//   });
// };
export const filterOrders = (orders, searchTerm) => {
  if (!searchTerm) return orders;
  return orders.filter(order =>
    (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.address && order.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );
};
export const updateOrderStatus = (orders, orderId, newStatus) => {
  return orders.map(order =>
    order._id === orderId ? { ...order, latest_status: newStatus } : order
  );
};

export const assignCourier = (orders, selectedOrders, selectedCourier) => {
  return orders.map(order => 
    selectedOrders.includes(order._id)
      ? { ...order, latest_status: 'on_their_way', courier: selectedCourier }
      : order
  );
};

export const getOrderStatus = (order) => {
  if (!order || !order.latest_status) {
    console.warn('Order has no latest_status:', order);
    return 'unknown';
  }

  const latestStatus = order.latest_status.toUpperCase();
  console.log('Latest status for order:', order._id, latestStatus);

  if (['READY', 'ACCEPTED'].includes(latestStatus)) return 'accepted';
  if (['ASSIGNED', 'COLLECTED'].includes(latestStatus)) return 'on_their_way';
  if (latestStatus === 'DELIVERED') return 'finished';
  return 'unknown';
};