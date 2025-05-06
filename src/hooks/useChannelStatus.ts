import { useEffect, useState } from 'react';
import { Channel, ChannelEvent } from '../utils/types';
import { ChannelService } from '../services/ChannelService';

export const useChannelStatus = (service: ChannelService) => {
  const [active, setActive] = useState<Channel | null>(null);
  const [error, setError] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const handle = (e: ChannelEvent) => {
      if (e.type === 'FAILOVER' && e.channelId === 'none') {
        setError(true);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Нет доступных каналов`]);
      } else {
        setError(false);
        const current = service.getActiveChannel();
        if (current) {
          setActive(current);
          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Активный канал: ${current.name}`]);
        }
      }
    };

    service.onEvent(handle);

    const firstActive = service.getActiveChannel();
    if (firstActive) {
      setActive(firstActive);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Начальное подключение: ${firstActive.name}`]);
    }
  }, [service]);

  return { active, error, logs };
};
