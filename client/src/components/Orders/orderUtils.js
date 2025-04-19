export const getOrderStatus = (order) => {
  if (!order) {
    return 'unknown';
  }
  
  // First check the status array (now the primary source of truth)
  if (order.status && order.status.length > 0) {
    const latestStatus = order.status[0]?.value?.toUpperCase();
    
    if (latestStatus) {
      if (['READY', 'ACCEPTED'].includes(latestStatus)) return 'accepted';
      if (['ASSIGNED', 'COLLECTED'].includes(latestStatus)) return 'on_their_way';
      if (latestStatus === 'DELIVERED') return 'finished';
      return 'unknown';
    }
  }
  
  // Fall back to latest_status field if status array is empty or invalid (for backward compatibility)
  if (order.latest_status) {
    const status = order.latest_status.toUpperCase();
    if (['READY', 'ACCEPTED'].includes(status)) return 'accepted';
    if (['ASSIGNED', 'COLLECTED'].includes(status)) return 'on_their_way';
    if (status === 'DELIVERED') return 'finished';
    return 'unknown';
  }
  
  return 'unknown';
};