// src/utils/designTokens.js

// Define semantic colors for order statuses
// These can be mapped to CSS classes or used directly if needed
export const statusColors = {
  accepted: {
    text: '#34a853',       // Green
    background: '#e6f4ea',
    statusBar: '#34a853'
  },
  on_their_way: {
    text: '#4285f4',      // Blue
    background: '#e1f5fe',
    statusBar: '#4285f4'
  },
  finished: {
    text: '#757575',      // Grey
    background: '#f5f5f5',
    statusBar: '#757575'
  },
  in_tender: {
    text: '#fbbc05',      // Yellow/Orange
    background: '#fff8e1',
    statusBar: '#fbbc05'
  },
  late: { // Special state, not a primary status
    text: '#ea4335',       // Red
    background: '#fce8e6',
    statusBar: '#ea4335' 
  },
  // Add other statuses like 'ready', 'assigned', 'delivered', 'declined' etc. as needed
  assigned: {
    text: '#1565c0',       // Darker Blue variant
    background: '#e3f2fd', 
    statusBar: '#1565c0'
  },
  delivered: {
    text: '#2e7d32',       // Darker Green variant
    background: '#e8f5e9',
    statusBar: '#2e7d32'
  },
  declined: {
    text: '#ea4335',       // Red
    background: '#fce8e6',
    statusBar: '#ea4335'
  },
  approved: { // Tender approved status
    text: '#34a853',       // Green
    background: '#e6f4ea',
    statusBar: '#34a853'
  },
   disapproved: { // Tender disapproved status
    text: '#ea4335',       // Red
    background: '#fce8e6',
    statusBar: '#ea4335'
  },
  unknown: {
    text: '#ea4335',       // Red
    background: '#fce8e6',
    statusBar: '#ea4335'
  },
  default: {
    text: '#757575',      // Grey
    background: '#f5f5f5',
    statusBar: '#ccc'      // Neutral grey bar
  }
};

// Function to get the appropriate CSS class based on status
// This avoids needing inline styles everywhere
export const getStatusClass = (status) => {
  const normalizedStatus = status?.toLowerCase() || 'unknown';
  // Return the class name matching the CSS
  return `status-${normalizedStatus}`;
};

// Function to get status bar class
export const getStatusBarClass = (status, isLate) => {
   if (isLate) return 'status-late'; // Prioritize late status for bar color
   const normalizedStatus = status?.toLowerCase() || 'unknown';
   return `status-${normalizedStatus}`;
}; 

// You might add more token categories here, like spacing, fonts, etc. 