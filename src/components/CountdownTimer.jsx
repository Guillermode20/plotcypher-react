import { useState, useEffect, useCallback } from 'react';

const CountdownTimer = () => {
  const calculateTime = useCallback(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }, []);

  const [timeUntilMidnight, setTimeUntilMidnight] = useState(calculateTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilMidnight(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTime]);

  return <span className="text-white/60">{timeUntilMidnight}</span>;
};

export default CountdownTimer;