import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      navigate('/shipit/businesses', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add your login logic here
    console.log('Login attempt with:', email, password);
    // Simulating an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // If login is successful:
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/shipit/businesses', { replace: true });
  };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input
//         type="email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         placeholder="Email"
//         required
//       />
//       <input
//         type="password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         placeholder="Password"
//         required
//       />
//       <button type="submit">Login</button>
//     </form>
//   );
// };

return (
  <div className={`login-container ${isRTL ? 'rtl' : ''}`}>
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