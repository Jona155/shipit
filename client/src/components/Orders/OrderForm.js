import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './OrderForm.css';

const OrderForm = ({ onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [orderData, setOrderData] = useState({
    customer: '',
    address: '',
    items: '',
    status: 'Accepted'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderData({ ...orderData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(orderData);
    setOrderData({
      customer: '',
      address: '',
      items: '',
      status: 'Accepted'
    });
  };

  return (
    <div className="order-form-container">
      <button onClick={onClose} className="close-button">×</button>
      <h2>{t('new_order')}</h2>
      <form onSubmit={handleSubmit} className="order-form">
        <input
          type="text"
          name="customer"
          value={orderData.customer}
          onChange={handleChange}
          placeholder={t('order_customer')}
          required
          className="form-input"
        />
        <input
          type="text"
          name="address"
          value={orderData.address}
          onChange={handleChange}
          placeholder={t('order_address')}
          required
          className="form-input"
        />
        <textarea
          name="items"
          value={orderData.items}
          onChange={handleChange}
          placeholder={t('order_items')}
          required
          className="form-input"
        />
        <button type="submit" className="submit-button">
          {t('add_order')}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;