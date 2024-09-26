import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CourierPopup = ({ onAssign, onClose }) => {
  const { t } = useTranslation();
  const [selectedCourier, setSelectedCourier] = useState('');

  return (
    <div className="popup-overlay">
      <div className="popup">
        <h2>{t('assign_courier')}</h2>
        <select 
          value={selectedCourier} 
          onChange={(e) => setSelectedCourier(e.target.value)}
        >
          <option value="">{t('select_courier')}</option>
          {couriers.map(courier => (
            <option key={courier} value={courier}>{courier}</option>
          ))}
        </select>
        <div className="popup-buttons">
          <button onClick={() => onAssign(selectedCourier)} disabled={!selectedCourier}>
            {t('assign')}
          </button>
          <button onClick={onClose}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
};

export default CourierPopup;