import { Channel, ChannelEvent, ChannelStatus } from '../utils/types';
import { connectWebSocket } from './WebSocketManager';

interface ChannelServiceOptions {
  checkInterval?: number;
  allowPriorityRestore?: boolean;
}

export class ChannelService {
  private channels: Channel[] = [];
  private activeChannel: Channel | null = null;
  private listeners: ((event: ChannelEvent) => void)[] = [];
  private buffer: any[] = [];
  private checkInterval: number;
  private allowPriorityRestore: boolean;
  private pollIntervalId: NodeJS.Timeout | null = null;

  constructor(channels: Channel[], options: ChannelServiceOptions = {}) {
    this.channels = channels
      .map(channel => ({ ...channel, status: 'idle' as ChannelStatus }))
      .sort((a, b) => a.priority - b.priority);

    this.checkInterval = options.checkInterval ?? 5000;
    this.allowPriorityRestore = options.allowPriorityRestore ?? false;

    this.monitor();
    this.periodicCheck();
    this.simulateFailure();
    setTimeout(() => this.failover(), 0);
  }

  private monitor() {
    setTimeout(() => this.monitor(), 5000);
  }

  private async failover() {
    const next = this.channels.find(c => c.status === 'idle');
    if (next) this.setActiveChannel(next);
    else this.emit({ type: 'FAILOVER', channelId: 'none', newStatus: 'unavailable' });
  }

  private periodicCheck() {
    setInterval(async () => {
      for (const ch of this.channels) {
        if (ch.status === 'unavailable' && ch.type === 'http') {
          try {
            const res = await fetch(ch.endpoint);
            if (res.ok) {
              ch.status = 'idle';
              this.emit({ type: 'RESTORED', channelId: ch.id, newStatus: 'idle' });
              if (
                this.allowPriorityRestore &&
                (!this.activeChannel || ch.priority < this.activeChannel.priority)
              ) {
                this.setActiveChannel(ch);
              }
            }
          } catch {
            console.log('error', ch);
          }
        }
      }
    }, this.checkInterval);
  }

  private setActiveChannel(channel: Channel) {
    if (this.activeChannel?.type === 'websocket') {
      this.activeChannel.socket?.close();
    }

    if (channel.type === 'websocket') {
      channel.socket = connectWebSocket(channel, this.handleWebSocketMessage);
    }

    if (this.activeChannel) this.activeChannel.status = 'idle';
    channel.status = 'connected';
    this.activeChannel = channel;
    this.emit({ type: 'STATUS_CHANGE', channelId: channel.id, newStatus: 'connected' });

    this.startPollingHttpChannel();
  }

  private startPollingHttpChannel() {
    if (this.pollIntervalId) clearInterval(this.pollIntervalId);
    if (this.activeChannel?.type !== 'http') return;

    this.pollIntervalId = setInterval(async () => {
      try {
        const res = await fetch(this.activeChannel!.endpoint);
        if (!res.ok) throw new Error();
        const data = await res.json();
        this.buffer.push(data);
      } catch {
        this.activeChannel!.status = 'unavailable';
        this.failover();
      }
    }, 3000);
  }

  private simulateFailure() {
    setInterval(() => {
      if (this.activeChannel) {
        this.activeChannel.status = 'unavailable';
        this.failover();
      }
    }, 15000);
  }

  private handleWebSocketMessage = (data: any) => {
    this.buffer.push(data);
  };

  public onEvent(listener: (event: ChannelEvent) => void) {
    this.listeners.push(listener);
  }

  private emit(event: ChannelEvent) {
    for (const l of this.listeners) l(event);
  }

  public getActiveChannel() {
    return this.activeChannel;
  }

  public getBufferedData(): any[] {
    return this.buffer.splice(0);
  }
}
