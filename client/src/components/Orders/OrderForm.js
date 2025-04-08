import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import './OrderForm.css';
import debounce from 'lodash/debounce';

const libraries = ['places'];

const OrderForm = ({ onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [orderData, setOrderData] = useState({
    customer_name: '',
    customer_phone_number: '',
    address: '',
    initial_address: '',
    input_address: '',
    amount: '',
    comments_for_order: '',
    comments_for_delivery: '',
    apartment_number: '',
    apartment_floor_number: '',
    location: { lat: 0, lng: 0 },
    place_id: '',
    status: 'ACCEPTED'
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const [loadingError, setLoadingError] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  useEffect(() => {
    if (loadError) {
      console.error('Maps API loading error:', loadError);
      setLoadingError(true);
    }
  }, [loadError]);

  const debouncedHandleChange = useMemo(
    () =>
      debounce((name, value) => {
        setOrderData(prev => ({ ...prev, [name]: value }));
      }, 10000),
    []
  );

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'address') {
      // Update UI immediately for address field
      setOrderData(prev => ({ ...prev, [name]: value }));
      // Debounce API calls
      debouncedHandleChange(name, value);
    } else {
      // Non-address fields update normally
      setOrderData(prev => ({ ...prev, [name]: value }));
    }
  };

  const onPlaceSelected = () => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      setOrderData(prev => ({
        ...prev,
        address: place.formatted_address,
        initial_address: place.formatted_address,
        input_address: place.formatted_address,
        location: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        },
        place_id: place.place_id
      }));
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    const timestamp = new Date().toISOString();

    // Build final order object for submission
    const newOrder = {
      ...orderData,
      timestamp,
      order_time: timestamp,
      status: [
        {
          value: 'ACCEPTED',
          timestamp
        }
      ],
      short_id: Math.random().toString(36).substring(2, 6).toUpperCase()
    };

    onSubmit(newOrder);
  };

  if (!isLoaded) return <div>{t('loading')}</div>;
  if (loadingError) return <div>{t('maps_load_error')}</div>;

  return (
      <div className="order-form-container">
        <button onClick={onClose} className="close-button">×</button>
        <h2>{t('new_order')}</h2>
        <form onSubmit={handleSubmit} className="order-form">
          <input
              type="text"
              name="customer_name"
              value={orderData.customer_name}
              onChange={handleChange}
              placeholder={t('customer_name')}
              required
              className="form-input"
          />
          <input
              type="tel"
              name="customer_phone_number"
              value={orderData.customer_phone_number}
              onChange={handleChange}
              placeholder={t('customer_phone')}
              required
              className="form-input"
          />
          <Autocomplete
              onLoad={setAutocomplete}
              onPlaceChanged={onPlaceSelected}
              restrictions={{country: 'IL'}}
          >
            <input
                type="text"
                name="address"
                value={orderData.address}
                onChange={handleChange}
                placeholder={t('order_address')}
                required
                className="form-input"
            />
          </Autocomplete>
          <input
              type="text"
              name="apartment_number"
              value={orderData.apartment_number}
              onChange={handleChange}
              placeholder={t('apartment_number')}
              className="form-input"
          />
          <input
              type="text"
              name="apartment_floor_number"
              value={orderData.apartment_floor_number}
              onChange={handleChange}
              placeholder={t('floor_number')}
              className="form-input"
          />
          <input
              type="number"
              name="amount"
              value={orderData.amount}
              onChange={handleChange}
              placeholder={t('order_amount')}
              required
              className="form-input"
          />
          <textarea
              name="comments_for_order"
              value={orderData.comments_for_order}
              onChange={handleChange}
              placeholder={t('order_comments')}
              className="form-input"
          />
          <textarea
              name="comments_for_delivery"
              value={orderData.comments_for_delivery}
              onChange={handleChange}
              placeholder={t('delivery_comments')}
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
