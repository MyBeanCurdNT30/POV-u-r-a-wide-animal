// Cross-Device and Cross-Tab Realtime Synchronization Utility
// Uses WebRTC P2P (via PeerJS) for 100% Serverless Static Hosting (e.g. GitHub Pages)
// With fallback to BroadcastChannel, LocalStorage, and REST API.

import Peer, { DataConnection } from 'peerjs';

export interface RoomEvent {
  type:
    | 'PLAYER_JOIN'
    | 'PLAYER_LOCK_IN'
    | 'PLAYER_REMOVE'
    | 'START_RESOLUTION'
    | 'HOST_SYNC'
    | 'CONNECTED'
    | 'REQUEST_STATE'
    | 'FULL_STATE';
  payload?: any;
  roomCode?: string;
  id?: string;
  timestamp?: number;
}

const CHANNEL_NAME = 'boss_card_game_room_channel';

function sanitizePeerId(roomCode: string): string {
  const clean = (roomCode || '8899').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `wcard-room-${clean || '8899'}`;
}

class RoomSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(event: RoomEvent) => void> = [];
  private currentRoomCode: string = '';
  private isHost: boolean = true;
  private processedEventIds: Set<string> = new Set();

  // WebRTC PeerJS state
  private peer: Peer | null = null;
  private hostConnection: DataConnection | null = null;
  private clientConnections: Map<string, DataConnection> = new Map();
  private reconnectTimer: any = null;
  private isConnecting: boolean = false;
  private isConnectedToHost: boolean = false;

  constructor() {
    // 1. BroadcastChannel (Tabs on same browser)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (msg: MessageEvent<RoomEvent>) => {
          this.handleIncomingEvent(msg.data, false);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
      }
    }

    // 2. LocalStorage Event (Tabs on same browser)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'boss_card_game_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleIncomingEvent(data, false);
          } catch (err) {
            console.error('Failed to parse storage event:', err);
          }
        }
      });
    }
  }

  public init(code: string, isHostRole: boolean) {
    this.isHost = isHostRole;
    this.setRoomCode(code);
  }

  public setRoomCode(code: string) {
    if (!code) return;
    const normalized = code.toUpperCase();
    if (this.currentRoomCode === normalized && this.peer && !this.peer.destroyed) {
      return;
    }
    this.currentRoomCode = normalized;
    this.setupPeer();
  }

  private setupPeer() {
    if (typeof window === 'undefined') return;

    // Clean up previous peer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }
    this.clientConnections.forEach((conn) => conn.close());
    this.clientConnections.clear();

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {
        // ignore
      }
      this.peer = null;
    }

    const hostPeerId = sanitizePeerId(this.currentRoomCode);

    if (this.isHost) {
      // Host creates deterministic Peer ID so mobile phones can connect
      try {
        this.peer = new Peer(hostPeerId, {
          debug: 0,
        });

        this.peer.on('open', (id) => {
          console.log(`[Host] Room Peer listening at: ${id}`);
        });

        this.peer.on('connection', (conn) => {
          this.handleIncomingClientConnection(conn);
        });

        this.peer.on('error', (err: any) => {
          console.warn('[Host] Peer error:', err?.type || err);
          if (err?.type === 'unavailable-id') {
            // ID occupied, attempt recreation after brief wait
            this.reconnectTimer = setTimeout(() => {
              this.setupPeer();
            }, 3000);
          }
        });
      } catch (e) {
        console.error('Failed to initialize Host Peer:', e);
      }
    } else {
      // Player/Client creates random Peer and connects to Host
      try {
        const clientPeerId = `wcard-p-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        this.peer = new Peer(clientPeerId, {
          debug: 0,
        });

        this.peer.on('open', () => {
          this.connectToHost(hostPeerId);
        });

        this.peer.on('error', (err: any) => {
          console.warn('[Player] Peer error:', err?.type || err);
          if (!this.isConnectedToHost) {
            this.schedulePlayerReconnect(hostPeerId);
          }
        });
      } catch (e) {
        console.error('Failed to initialize Player Peer:', e);
      }
    }
  }

  private handleIncomingClientConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log(`[Host] Player connected: ${conn.peer}`);
      this.clientConnections.set(conn.peer, conn);

      // Ask the host's app to sync state to the new client
      this.notifyListeners({
        type: 'REQUEST_STATE',
        roomCode: this.currentRoomCode,
        payload: { peerId: conn.peer },
      });
    });

    conn.on('data', (data: any) => {
      try {
        const event = typeof data === 'string' ? JSON.parse(data) : data;
        if (event && event.type) {
          // Process locally
          this.handleIncomingEvent(event, false);
          // Relay to other connected clients
          this.relayToClients(event, conn.peer);
        }
      } catch (err) {
        console.error('Error handling data from client:', err);
      }
    });

    conn.on('close', () => {
      this.clientConnections.delete(conn.peer);
    });

    conn.on('error', () => {
      this.clientConnections.delete(conn.peer);
    });
  }

  private connectToHost(hostPeerId: string) {
    if (!this.peer || this.peer.destroyed || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const conn = this.peer.connect(hostPeerId, {
        reliable: true,
      });

      conn.on('open', () => {
        this.isConnecting = false;
        this.isConnectedToHost = true;
        this.hostConnection = conn;
        console.log('[Player] Connected to Host WebRTC successfully!');

        // Check if we have a locally stored hero to re-announce
        if (typeof window !== 'undefined') {
          const heroId = sessionStorage.getItem('my_hero_id');
          const heroName = sessionStorage.getItem('my_hero_name');
          if (heroName) {
            this.broadcast({
              type: 'PLAYER_JOIN',
              payload: { heroName, existingHeroId: heroId },
            });
          }
        }
      });

      conn.on('data', (data: any) => {
        try {
          const event = typeof data === 'string' ? JSON.parse(data) : data;
          if (event && event.type) {
            this.handleIncomingEvent(event, false);
          }
        } catch (err) {
          console.error('Error handling data from host:', err);
        }
      });

      conn.on('close', () => {
        this.isConnecting = false;
        this.isConnectedToHost = false;
        this.hostConnection = null;
        this.schedulePlayerReconnect(hostPeerId);
      });

      conn.on('error', () => {
        this.isConnecting = false;
        this.isConnectedToHost = false;
        this.hostConnection = null;
        this.schedulePlayerReconnect(hostPeerId);
      });
    } catch (e) {
      this.isConnecting = false;
      this.schedulePlayerReconnect(hostPeerId);
    }
  }

  private schedulePlayerReconnect(hostPeerId: string) {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isConnectedToHost && this.peer && !this.peer.destroyed) {
        this.connectToHost(hostPeerId);
      }
    }, 2500);
  }

  private relayToClients(event: RoomEvent, senderPeerId?: string) {
    const message = JSON.stringify(event);
    this.clientConnections.forEach((conn, peerId) => {
      if (peerId !== senderPeerId && conn.open) {
        try {
          conn.send(message);
        } catch (e) {
          // send error
        }
      }
    });
  }

  public subscribe(callback: (event: RoomEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public broadcast(event: RoomEvent) {
    const stampedEvent: RoomEvent = {
      ...event,
      roomCode: this.currentRoomCode || event.roomCode,
      id: event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: event.timestamp || Date.now(),
    };

    this.processedEventIds.add(stampedEvent.id!);

    // 1. BroadcastChannel (Same-device tabs)
    if (this.channel) {
      try {
        this.channel.postMessage(stampedEvent);
      } catch (e) {
        // channel error
      }
    }

    // 2. LocalStorage (Same-device tabs)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('boss_card_game_event', JSON.stringify(stampedEvent));
      } catch (e) {
        // localstorage error
      }
    }

    // 3. WebRTC P2P (Cross-Device Mobile <-> Host over Internet)
    const jsonStr = JSON.stringify(stampedEvent);
    if (this.isHost) {
      // Host sends to all connected mobile player peers
      this.clientConnections.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send(jsonStr);
          } catch (e) {
            // ignore
          }
        }
      });
    } else {
      // Mobile player sends to host peer
      if (this.hostConnection && this.hostConnection.open) {
        try {
          this.hostConnection.send(jsonStr);
        } catch (e) {
          // ignore
        }
      }
    }

    // 4. REST API fallback (if running custom Express Node server)
    if (this.currentRoomCode && typeof window !== 'undefined') {
      fetch(`/api/rooms/${this.currentRoomCode}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
      }).catch(() => {
        // silent on static sites like GitHub Pages
      });
    }

    this.notifyListeners(stampedEvent);
  }

  public async fetchRoomState(roomCode: string) {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/state`);
      if (res.ok) {
        const state = await res.json();
        return state;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  private handleIncomingEvent(event: RoomEvent, isRelayedFromPeer = false) {
    if (!event || !event.type) return;

    if (event.roomCode && this.currentRoomCode && event.roomCode !== this.currentRoomCode) {
      return;
    }

    // Deduplicate
    if (event.id && this.processedEventIds.has(event.id)) {
      return;
    }
    if (event.id) {
      this.processedEventIds.add(event.id);
      if (this.processedEventIds.size > 200) {
        const first = this.processedEventIds.values().next().value;
        if (first) this.processedEventIds.delete(first);
      }
    }

    this.notifyListeners(event);
  }

  private notifyListeners(event: RoomEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in room event listener:', e);
      }
    });
  }
}

export const roomSync = new RoomSync();
