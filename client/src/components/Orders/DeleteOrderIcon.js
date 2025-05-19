import React from 'react';
import { useTranslation } from 'react-i18next';
import './DeleteOrderIcon.css';

// Trash icon component
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const DeleteOrderIcon = React.memo(({ orderShortId, onClick, isVendor, className = '' }) => {
  const { t } = useTranslation();

  // Hide completely for vendors per requirements
  if (isVendor) {
    return null;
  }

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent card click or other parent events
    e.preventDefault(); // Prevent any default behavior
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`delete-order-icon-wrapper ${className}`}
      onClick={handleClick}
      onKeyPress={(e) => e.key === 'Enter' && handleClick(e)}
      role="button"
      tabIndex={0}
      aria-label={t('deleteOrderAction', { shortId: orderShortId })}
      title={t('deleteOrderAction', { shortId: orderShortId })}
    >
      <TrashIcon />
    </div>
  );
});

export default DeleteOrderIcon; 