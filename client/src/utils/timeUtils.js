// timeUtils.js - Utility functions for consistent timezone handling

/**
 * Generates the current timestamp in UTC ISO format.
 * @returns {string} - ISO format timestamp in UTC (e.g., "2023-10-27T10:30:00.000Z")
 */
export const generateCurrentUTCTimestamp = () => {
  const timestamp = new Date().toISOString();
  console.log('DEBUG - Generated UTC timestamp:', {
    timestamp,
    localTime: new Date().toString(),
    utcTime: new Date().toUTCString()
  });
  return timestamp;
};

/**
 * Adjusts server timestamps to correct timezone issues.
 * Use this if the server consistently returns timestamps that need correction.
 * @param {string} serverTimestamp - Timestamp from the server
 * @returns {string} - Corrected ISO timestamp
 */
export const correctServerTimestamp = (serverTimestamp) => {
  if (!serverTimestamp) return '';
  
  try {
    // Parse the server timestamp
    const date = new Date(serverTimestamp);
    // Add 3 hours to correct the timezone issue
    date.setHours(date.getHours() + 3);
    return date.toISOString();
  } catch (error) {
    console.error('Error correcting server timestamp:', error);
    return serverTimestamp;
  }
};

/**
 * Displays a UTC timestamp in a specified timezone for the UI.
 * @param {string} utcTimestamp - UTC ISO timestamp string.
 * @param {string} targetTimezone - Timezone to display in (default: 'Asia/Jerusalem').
 * @param {object} options - Format options for toLocaleString.
 * @returns {string} - Formatted date string in the target timezone.
 */
export const formatDateForDisplay = (utcTimestamp, targetTimezone = 'Asia/Jerusalem', options = {}) => {
  if (!utcTimestamp) return '';
  
  console.log('DEBUG - formatDateForDisplay input:', { 
    utcTimestamp, 
    targetTimezone,
    utcDate: new Date(utcTimestamp).toUTCString() 
  });
  
  try {
    const date = new Date(utcTimestamp);
    
    const defaultDisplayOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: targetTimezone,
      ...options
    };
    
    const formattedResult = date.toLocaleString(undefined, defaultDisplayOptions);
    
    console.log('DEBUG - formatDateForDisplay output:', {
      formattedResult,
      options: defaultDisplayOptions
    });
    
    return formattedResult;
  } catch (error) {
    console.error('Error formatting date for display:', error, { utcTimestamp, targetTimezone });
    // Fallback to basic UTC display if formatting fails
    try {
      return new Date(utcTimestamp).toLocaleTimeString() + ' UTC (fallback)';
    } catch {
      return 'Invalid Date (fallback)';
    }
  }
};

/**
 * Calculates if an order is late based on its UTC timestamp and SLA in minutes.
 * All comparisons are done in UTC.
 * @param {string} utcTimestamp - Order's creation/status UTC timestamp.
 * @param {number} slaMinutes - SLA in minutes.
 * @returns {boolean} - Whether the order is late.
 */
export const isOrderLate = (utcTimestamp, slaMinutes) => {
  if (!utcTimestamp || slaMinutes === undefined || slaMinutes === null) return false;
  
  // Correct server timestamp if needed
  const correctedTimestamp = correctServerTimestamp(utcTimestamp);
  
  console.log('DEBUG - isOrderLate input:', { 
    utcTimestamp, 
    correctedTimestamp,
    slaMinutes,
    utcDate: new Date(utcTimestamp).toUTCString(),
    correctedDate: new Date(correctedTimestamp).toUTCString()
  });
  
  try {
    const orderDate = new Date(correctedTimestamp); // Use corrected timestamp
    const slaMilliseconds = slaMinutes * 60 * 1000;
    const deadline_utc = new Date(orderDate.getTime() + slaMilliseconds);
    const now_utc = new Date(); // Current time in UTC
    
    const isLate = now_utc > deadline_utc;
    
    console.log('DEBUG - isOrderLate calculation:', {
      orderDate: orderDate.toUTCString(),
      deadline: deadline_utc.toUTCString(),
      now: now_utc.toUTCString(),
      isLate
    });
    
    return isLate;
  } catch (error) {
    console.error('Error calculating if order is late:', error, { utcTimestamp, slaMinutes });
    return false; // Consider it not late if there's an error
  }
}; 