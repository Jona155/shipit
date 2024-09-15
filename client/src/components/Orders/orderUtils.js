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

export const filterOrders = (orders, searchTerm) => {
  if (!Array.isArray(orders)) return [];
  
  return orders.filter(order => {
    const customerName = order.customer_name || '';
    const address = order.address || '';
    const comments = order.comments_for_order || '';
    const searchTermLower = searchTerm.toLowerCase();

    return (
      customerName.toLowerCase().includes(searchTermLower) ||
      address.toLowerCase().includes(searchTermLower) ||
      comments.toLowerCase().includes(searchTermLower)
    );
  });
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