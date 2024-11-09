
import { useState, useEffect } from 'react';

const CountdownTimer = () => {
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    const timer = setInterval(() => {
      setTimeUntilMidnight(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-white/60">{timeUntilMidnight}</span>
  );
};

export default CountdownTimer;