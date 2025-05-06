// src/components/ChannelManager.tsx
import React, { useState, useMemo } from 'react';
import { Channel } from '../utils/types';
import { ChannelService } from '../services/ChannelService';
import { useChannelStatus } from '../hooks/useChannelStatus';
import { useBufferedData } from '../hooks/useBufferedData';
import './ChannelManager.css';
import { v4 as uuidv4 } from 'uuid';

const initialChannels: Channel[] = [
  {
    id: uuidv4(),
    name: 'Joke API',
    endpoint: 'https://official-joke-api.appspot.com/random_joke',
    type: 'http',
    status: 'idle',
    priority: 1
  },
  {
    id: uuidv4(),
    name: 'Random User API',
    endpoint: 'https://randomuser.me/api/',
    type: 'http',
    status: 'idle',
    priority: 2
  }
];

const service = new ChannelService(initialChannels, {
  checkInterval: 10000,
  allowPriorityRestore: true
});

const assignIds = (items: any[]) => {
  return items.map(item => {
    if (item.__uuid) return item;
    return { ...item, __uuid: uuidv4() };
  });
};

const assignLogIds = (logs: string[]) => {
  return logs.map(entry => ({ __uuid: uuidv4(), entry }));
};

export const ChannelManager = () => {
  const { active, error, logs } = useChannelStatus(service);
  const rawBuffered = useBufferedData(service);
  const buffered = useMemo(() => assignIds(rawBuffered), [rawBuffered]);
  const logsWithIds = useMemo(() => assignLogIds(logs), [logs]);
  const [activeTab, setActiveTab] = useState<'buffer' | 'log'>('buffer');

  return (
    <div className="channel-manager">
      <h2>Связь</h2>
      {!active && !error && <p>Подключение...</p>}
      {error ? (
        <p className="channel-error">Нет доступных каналов!</p>
      ) : active ? (
        <p>Активный канал: {active.name}</p>
      ) : null}

      <div className="tabs">
        <button
          className={activeTab === 'buffer' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('buffer')}
        >
          Буфер ({buffered.length})
        </button>
        <button
          className={activeTab === 'log' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('log')}
        >
          Лог ({logs.length})
        </button>
      </div>

      {activeTab === 'buffer' && (
        <ul className="buffer-list">
          {buffered.map((item) => (
            <li key={item.__uuid} className="buffer-item">
              {item.setup && item.punchline ? (
                <span>{item.setup} — {item.punchline}</span>
              ) : item.results ? (
                <div>
                  <img src={item.results[0]?.picture?.medium} alt="user" className="buffer-image" />
                  <p>{item.results[0]?.name?.first} {item.results[0]?.name?.last}</p>
                  <p>{item.results[0]?.phone}</p>
                </div>
              ) : (
                <pre>{JSON.stringify(item)}</pre>
              )}
            </li>
          ))}
        </ul>
      )}

      {activeTab === 'log' && (
        <ul className="log-list">
          {logsWithIds.map(log => (
            <li key={log.__uuid}>{log.entry}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
