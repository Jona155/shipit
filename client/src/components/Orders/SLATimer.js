import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './SLATimer.css';

const SLATimer = ({ orderTime, slaMinutes }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [elapsedDisplay, setElapsedDisplay] = useState('0');
  const [textLength, setTextLength] = useState('short');
  const [progressColor, setProgressColor] = useState('#3a86ff'); // Default blue
  const { t, i18n } = useTranslation();
  
  // Check if the current language is Hebrew
  const isHebrew = i18n.language === 'he';

  useEffect(() => {
    if (!orderTime || !slaMinutes) return;

    // Explicitly handle the timestamp as UTC and add 3 hours for Israel timezone
    const getAdjustedTimestamp = (timestamp) => {
      // Create a date object from the timestamp (assuming it's in UTC)
      const date = new Date(timestamp);
      
      // Log the original timestamp and parsed date for debugging
      console.log('Original timestamp:', timestamp);
      console.log('Parsed date:', date.toISOString());
      
      return date;
    };

    const orderDate = getAdjustedTimestamp(orderTime);
    const slaMilliseconds = slaMinutes * 60 * 1000;
    
    const calculateTimeElapsed = () => {
      // Current time in local timezone
      const now = new Date();
      
      // Calculate elapsed time
      const elapsed = now - orderDate;
      
      // Log the values for debugging
      console.log('Current time:', now.toISOString());
      console.log('Order time (adjusted):', orderDate.toISOString());
      console.log('Elapsed milliseconds:', elapsed);
      
      return elapsed;
    };

    const updateTimer = () => {
      const elapsed = calculateTimeElapsed();
      const elapsedPercent = (elapsed / slaMilliseconds) * 100;
      
      // Update the elapsed time display with translations
      const elapsedMinutes = Math.floor(elapsed / (60 * 1000));
      
      let display;
      let textLengthClass = 'short';
      
      if (elapsedMinutes >= 60) {
        const hours = Math.floor(elapsedMinutes / 60);
        
        // Format based on language
        if (hours >= 10) {
          display = isHebrew 
            ? `${hours}ש׳` 
            : `${hours}h`;
          textLengthClass = 'medium';
        } else {
          display = isHebrew 
            ? `${hours}ש׳` 
            : `${hours}h`;
          textLengthClass = 'short';
        }
      } else {
        // Format based on language
        if (elapsedMinutes >= 100) {
          display = `${elapsedMinutes}`; // Just the number for 100+ minutes
          textLengthClass = 'medium';
        } else {
          display = isHebrew 
            ? `${elapsedMinutes}ד׳` 
            : `${elapsedMinutes}m`;
          textLengthClass = 'short';
        }
      }
      
      setElapsedDisplay(display);
      setTextLength(textLengthClass);
      setElapsedTime(elapsedPercent);
      
      // Update color based on elapsed percentage
      if (elapsedPercent > 100) {
        setProgressColor('#FF5252'); // Red for SLA breach
      } else if (elapsedPercent > 60) {
        setProgressColor('#FFA726'); // Orange for approaching SLA
      } else {
        setProgressColor('#3a86ff'); // Blue for good timing
      }
    };

    // Initial update
    updateTimer();
    
    // Set interval to update every 15 seconds for more accurate display
    const intervalId = setInterval(updateTimer, 15000);
    
    return () => clearInterval(intervalId);
  }, [orderTime, slaMinutes, isHebrew]);
  
  // Define size for the circular progress
  const size = textLength === 'medium' ? 56 : 50;
  
  return (
    <div className={`sla-timer ${textLength} ${isHebrew ? 'rtl' : 'ltr'}`}>
      <div style={{ width: size, height: size }}>
        <CircularProgressbar
          value={Math.min(elapsedTime, 100)}
          text={elapsedDisplay}
          strokeWidth={6}
          styles={buildStyles({
            // Set path color based on progress
            pathColor: progressColor,
            // Customize text style
            textSize: textLength === 'medium' ? '26px' : '30px',
            textColor: '#333',
            fontWeight: 600,
            // Trail/background style
            trailColor: '#e0e0e0',
            // Make trail dashed
            trailLineCap: 'round',
            pathTransition: 'stroke-dashoffset 0.5s ease 0s',
          })}
        />
      </div>
    </div>
  );
};

export default SLATimer; 