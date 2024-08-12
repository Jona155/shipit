export const filterOrders = (orders, searchTerm) => {
    return orders.filter(order => 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  export const updateOrderStatus = (orders, orderId, newStatus) => {
    return orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
  };
  
  export const assignCourier = (orders, selectedOrders, selectedCourier) => {
    return orders.map(order => 
      selectedOrders.includes(order.id)
        ? { ...order, status: 'On Their Way', courier: selectedCourier }
        : order
    );
  };