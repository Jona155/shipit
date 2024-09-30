import React, { createContext, useState, useContext, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
            headers: {
              'Authorization': token
            }
          });
          if (response.ok) {
            setIsLoggedIn(true);
          } else {
            // If token is invalid, remove it and set isLoggedIn to false
            localStorage.removeItem('authToken');
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error('Token validation error:', error);
          localStorage.removeItem('authToken');
          setIsLoggedIn(false);
        }
      }
    };

    validateToken();
  }, []);

  const login = (token) => {
    localStorage.setItem('authToken', token);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);