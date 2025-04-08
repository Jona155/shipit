export const getOrderStatus = (order) => {
  if (!order) {
    return 'unknown';
  }
  
  // First try to use the latest_status field if it exists
  if (order.latest_status) {
    const status = order.latest_status.toUpperCase();
    if (['READY', 'ACCEPTED'].includes(status)) return 'accepted';
    if (['ASSIGNED', 'COLLECTED'].includes(status)) return 'on_their_way';
    if (status === 'DELIVERED') return 'finished';
    return 'unknown';
  }
  
  // Fall back to checking the status array
  if (!order.status || !order.status.length) {
    return 'unknown';
  }

  // Get the most recent status from the status array
  const latestStatus = order.status[0]?.value?.toUpperCase();

  if (!latestStatus) {
    return 'unknown';
  }

  if (['READY', 'ACCEPTED'].includes(latestStatus)) return 'accepted';
  if (['ASSIGNED', 'COLLECTED'].includes(latestStatus)) return 'on_their_way';
  if (latestStatus === 'DELIVERED') return 'finished';
  return 'unknown';
};