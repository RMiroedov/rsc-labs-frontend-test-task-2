import { Channel } from '../utils/types';

export const connectWebSocket = (channel: Channel, onMessage: (data: any) => void): WebSocket => {
  const ws = new WebSocket(channel.endpoint);

  ws.onopen = () => console.log(`WebSocket ${channel.name} connected`);
  ws.onerror = () => console.error(`WebSocket ${channel.name} error`);
  ws.onmessage = (event) => onMessage(JSON.parse(event.data));

  return ws;
};
