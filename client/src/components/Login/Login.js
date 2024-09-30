import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Login.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isRTL = i18n.language === 'he';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token);
      navigate('/shipit/businesses');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || t('login_error'));
    }
  };

  return (
    <div className={`login-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <form onSubmit={handleSubmit} className="login-form">
        <h2>{t('login')}</h2>
        {error && <p className="error">{error}</p>}
        <div className="form-group">
          <label htmlFor="username">{t('username')}</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">{t('password')}</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">{t('login')}</button>
      </form>
    </div>
  );
};

export default Login;