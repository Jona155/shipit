import React from 'react';
import { useTranslation } from 'react-i18next';
import { getStatusClass } from '../../utils/designTokens'; // Adjust path as needed
import './OrdersList.css'; // Ensure styles are available

const OrderStatusChip = ({ status }) => {
  const { t } = useTranslation();
  const statusText = status || 'unknown';
  const cssClass = getStatusClass(statusText);

  return (
    <span className={`status-chip ${cssClass}`}>
      {t(statusText.toLowerCase(), statusText)} 
    </span>
  );
};

export default OrderStatusChip; 