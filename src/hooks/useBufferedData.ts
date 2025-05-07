import { useEffect, useState } from 'react';
import { ChannelService } from '../services/ChannelService';
import { JokeResponse, RandomUserResponse } from '../utils/apiTypes';

export type BufferedItem = JokeResponse | RandomUserResponse;

export const useBufferedData = (service: ChannelService, intervalMs = 2000) => {
  const [buffered, setBuffered] = useState<BufferedItem[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const data = service.getBufferedData();
      if (data.length > 0) {
        setBuffered(prev => [...prev, ...data]);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [service, intervalMs]);

  return buffered;
};
