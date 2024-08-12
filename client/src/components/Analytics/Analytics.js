import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Mock data - replace with actual API calls in a real application
const mockOrderData = [
  { day: 'Monday', averageOrders: 45 },
  { day: 'Tuesday', averageOrders: 52 },
  { day: 'Wednesday', averageOrders: 49 },
  { day: 'Thursday', averageOrders: 58 },
  { day: 'Friday', averageOrders: 65 },
  { day: 'Saturday', averageOrders: 72 },
  { day: 'Sunday', averageOrders: 40 },
];

const Analytics = () => {
  const { t, i18n } = useTranslation();
  const [weeklyData, setWeeklyData] = useState([]);
  const [todayOrders, setTodayOrders] = useState(0);

  const isRTL = i18n.language === 'he';

  useEffect(() => {
    // Simulating API call to fetch data
    setTimeout(() => {
      setWeeklyData(mockOrderData.map(data => ({
        ...data,
        day: t(data.day.toLowerCase())
      })));
      setTodayOrders(Math.floor(Math.random() * 100)); // Random number for demo
    }, 1000);
  }, [t]);

  const chartData = {
    labels: weeklyData.map(data => data.day),
    datasets: [
      {
        label: t('average_orders'),
        data: weeklyData.map(data => data.averageOrders),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t('average_orders_by_day'),
      },
    },
    scales: {
      x: {
        reverse: isRTL,
      },
    },
  };

  return (
    <div className={`analytics-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <h1>{t('analytics_dashboard')}</h1>
      
      <div className="today-orders">
        <h2>{t('todays_orders')}</h2>
        <div className="order-count">{todayOrders}</div>
      </div>

      <div className="weekly-chart">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default Analytics;