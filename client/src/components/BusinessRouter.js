import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import HomePage from './HomePage';
import Orders from './Orders/Orders';
import Users from './Users/Users';
import Analytics from './Analytics/Analytics';
import Settings from './Settings/Settings';

const BusinessRouter = () => {
  const { businessId } = useParams();

  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="orders" element={<Orders />} />
      <Route path="users" element={<Users />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="settings" element={<Settings />} />
    </Routes>
  );
};

export default BusinessRouter;