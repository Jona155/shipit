import React from 'react';
import Loading from './common/Loading';

const Loader = ({ size = 'fullscreen' }) => {
  return <Loading size={size} />;
};

export default Loader;