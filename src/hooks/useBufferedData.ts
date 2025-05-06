import { useEffect, useState } from 'react';
import { ChannelService } from '../services/ChannelService';

export const useBufferedData = (service: ChannelService, intervalMs = 2000) => {
  const [buffered, setBuffered] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const data = service.getBufferedData();
      if (data.length > 0) setBuffered(prev => [...prev, ...data]);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [service, intervalMs]);

  return buffered;
};
