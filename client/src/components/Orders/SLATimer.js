import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './SLATimer.css';
import { formatDateForDisplay, correctServerTimestamp } from '../../utils/timeUtils';

const SLATimer = ({ orderTime, slaMinutes }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [elapsedDisplay, setElapsedDisplay] = useState('0');
  const [textLength, setTextLength] = useState('short');
  const [progressColor, setProgressColor] = useState('#3a86ff'); // Default blue
  const { t, i18n } = useTranslation();
  
  // Check if the current language is Hebrew
  const isHebrew = i18n.language === 'he';

  useEffect(() => {
    if (!orderTime || slaMinutes === undefined || slaMinutes === null) return;

    console.log('DEBUG - SLATimer initialization:', {
      orderTime,
      slaMinutes,
      parsedOrderTime: new Date(orderTime).toString(),
      utcOrderTime: new Date(orderTime).toUTCString(),
      currentTime: new Date().toString(),
      utcCurrentTime: new Date().toUTCString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Apply timestamp correction if needed
    const correctedOrderTime = correctServerTimestamp(orderTime);
    console.log('DEBUG - SLATimer using corrected timestamp:', {
      original: orderTime,
      corrected: correctedOrderTime,
      originalParsed: new Date(orderTime).toUTCString(),
      correctedParsed: new Date(correctedOrderTime).toUTCString()
    });

    const orderDate_utc = new Date(correctedOrderTime); // Use corrected timestamp
    const slaMilliseconds = slaMinutes * 60 * 1000;
    
    const calculateTimeElapsed = () => {
      const now_utc = new Date(); // Current UTC time
      const elapsed = now_utc.getTime() - orderDate_utc.getTime(); // Difference in milliseconds
      return elapsed;
    };

    const updateTimer = () => {
      const elapsed = calculateTimeElapsed();
      const elapsedPercent = slaMilliseconds > 0 ? (elapsed / slaMilliseconds) * 100 : 0;
      
      const elapsedMinutes = Math.floor(elapsed / (60 * 1000));
      
      let display;
      let textLengthClass = 'short';
      
      if (elapsedMinutes >= 60) {
        const hours = Math.floor(elapsedMinutes / 60);
        if (hours >= 10) {
          display = isHebrew ? `${hours}ש׳` : `${hours}h`;
          textLengthClass = 'medium';
        } else {
          display = isHebrew ? `${hours}ש׳` : `${hours}h`;
          textLengthClass = 'short';
        }
      } else {
        if (elapsedMinutes >= 100) {
          display = `${elapsedMinutes}`;
          textLengthClass = 'medium';
        } else {
          display = isHebrew ? `${elapsedMinutes}ד׳` : `${elapsedMinutes}m`;
          textLengthClass = 'short';
        }
      }
      
      setElapsedDisplay(display);
      setTextLength(textLengthClass);
      setElapsedTime(elapsedPercent);
      
      if (elapsedPercent > 100) {
        setProgressColor('#FF5252'); 
      } else if (elapsedPercent > 60) {
        setProgressColor('#FFA726'); 
      } else {
        setProgressColor('#3a86ff'); 
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 15000);
    return () => clearInterval(intervalId);
  }, [orderTime, slaMinutes, isHebrew]);
  
  // Define size for the circular progress
  const size = textLength === 'medium' ? 56 : 50;
  
  return (
    <div className={`sla-timer ${textLength} ${isHebrew ? 'rtl' : 'ltr'}`}>
      <div style={{ width: size, height: size }}>
        <CircularProgressbar
          value={Math.min(Math.max(elapsedTime, 0), 100)} // Ensure value is between 0 and 100
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