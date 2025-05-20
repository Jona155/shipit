import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import './OrderForm.css';
import debounce from 'lodash/debounce';
import Loading from '../common/Loading';
import '../common/styles.css';
import { generateCurrentUTCTimestamp } from '../../utils/timeUtils';

const libraries = ['places'];

// Default form state for new orders
const getDefaultOrderData = () => ({
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

const OrderForm = ({ 
  onSubmit, 
  onClose, 
  isEditing = false, 
  orderData: existingOrderData = null,
  onSaveEdit = null
}) => {
  const { t } = useTranslation();
  
  // Initialize with existing data if editing, otherwise use defaults
  const [orderData, setOrderData] = useState(() => {
    if (isEditing && existingOrderData) {
      // Format data for editing
      return {
        customer_name: existingOrderData.customer_name || '',
        customer_phone_number: existingOrderData.customer_phone_number || '',
        address: existingOrderData.address || '',
        initial_address: existingOrderData.initial_address || existingOrderData.address || '',
        input_address: existingOrderData.input_address || existingOrderData.address || '',
        amount: existingOrderData.amount || '',
        comments_for_order: existingOrderData.comments_for_order || '',
        comments_for_delivery: existingOrderData.comments_for_delivery || '',
        apartment_number: existingOrderData.apartment_number || '',
        apartment_floor_number: existingOrderData.apartment_floor_number || '',
        location: existingOrderData.location || { lat: 0, lng: 0 },
        place_id: existingOrderData.place_id || '',
        status: existingOrderData.status?.[0]?.value || 'ACCEPTED'
      };
    }
    return getDefaultOrderData();
  });

  // Store original values for edit history
  const [originalValues, setOriginalValues] = useState(() => {
    if (isEditing && existingOrderData) {
      return { ...orderData };
    }
    return {};
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
    
    if (isEditing) {
      // Prepare edited data with change tracking for audit
      const changedFields = {};
      const previousValues = {};
      
      // Only include fields that have changed in the update
      Object.keys(orderData).forEach(key => {
        if (orderData[key] !== originalValues[key]) {
          changedFields[key] = orderData[key];
          previousValues[`previous_${key}`] = originalValues[key];
        }
      });
      
      // Only proceed if there are changes
      if (Object.keys(changedFields).length > 0) {
        // Always include the order ID and essential fields
        onSaveEdit({
          _id: existingOrderData._id,
          ...changedFields,
          ...previousValues,
          // Include location and place_id if they exist
          location: orderData.location || existingOrderData.location,
          place_id: orderData.place_id || existingOrderData.place_id
        });
      } else {
        // No changes were made
        onClose();
      }
    } else {
      // Create new order
      const timestamp = generateCurrentUTCTimestamp();
      
      console.log('DEBUG - New order timestamp details:', {
        timestamp,
        parsed: new Date(timestamp).toString(),
        utc: new Date(timestamp).toUTCString(),
        rawDate: new Date(),
        rawUTC: new Date().toUTCString(),
        timezoneOffset: new Date().getTimezoneOffset(),
        timezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
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
      
      console.log('DEBUG - Submitting new order with timestamps:', {
        timestamp: newOrder.timestamp,
        order_time: newOrder.order_time,
        status_timestamp: newOrder.status[0].timestamp
      });
      
      onSubmit(newOrder);
    }
  };

  if (!isLoaded) return <Loading size="medium" />;
  if (loadingError) return <div className="error-message">{t('maps_load_error')}</div>;

  // Determine title and button text based on mode
  const formTitle = isEditing ? t('edit_order') : t('new_order');
  const submitButtonText = isEditing ? t('save_changes') : t('add_order');

  return (
      <div className="order-form-container">
        <button onClick={onClose} className="close-button">×</button>
        <h2>{formTitle}</h2>
        <form onSubmit={handleSubmit} className="order-form">
          <input
              type="text"
              name="customer_name"
              value={orderData.customer_name}
              onChange={handleChange}
              placeholder={t('customer_name')}
              className="form-input"
          />
          <input
              type="tel"
              name="customer_phone_number"
              value={orderData.customer_phone_number}
              onChange={handleChange}
              placeholder={t('customer_phone')}
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
            {submitButtonText}
          </button>
        </form>
      </div>
  );
};

export default OrderForm;
