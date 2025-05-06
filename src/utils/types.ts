export type ChannelStatus = 'idle' | 'connected' | 'unavailable';
export type ChannelType = 'http' | 'websocket';

export interface Channel {
  id: string;
  name: string;
  endpoint: string;
  type: ChannelType;
  priority: number;
  status: ChannelStatus;
  socket?: WebSocket;
}

export interface ChannelEvent {
  type: 'STATUS_CHANGE' | 'FAILOVER' | 'RESTORED';
  channelId: string;
  newStatus: ChannelStatus;
}
