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