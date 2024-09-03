import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Here, you would typically make an API call to your backend
    // For now, we'll just simulate a successful login
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, consider any non-empty input as successful login
      if (email && password) {
        // Store the user's login state (you might want to use a more secure method later)
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/');
      } else {
        setError(t('login_error'));
      }
    } catch (err) {
      setError(t('login_error'));
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>{t('login')}</h2>
        {error && <p className="error">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">{t('email')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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