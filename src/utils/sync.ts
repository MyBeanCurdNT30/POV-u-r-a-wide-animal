// Cross-Device and Cross-Tab Realtime Synchronization Utility

export interface RoomEvent {
  type: 'PLAYER_JOIN' | 'PLAYER_LOCK_IN' | 'PLAYER_REMOVE' | 'START_RESOLUTION' | 'HOST_SYNC' | 'CONNECTED';
  payload?: any;
  roomCode?: string;
  id?: string;
  timestamp?: number;
}

const CHANNEL_NAME = 'boss_card_game_room_channel';

class RoomSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(event: RoomEvent) => void> = [];
  private eventSource: EventSource | null = null;
  private currentRoomCode: string = '';
  private processedEventIds: Set<string> = new Set();
  private lastPollTimestamp: number = 0;
  private pollInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (msg: MessageEvent<RoomEvent>) => {
          this.handleIncomingEvent(msg.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or restricted:', e);
      }
    }

    // Fallback using LocalStorage event across tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'boss_card_game_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleIncomingEvent(data);
          } catch (err) {
            console.error('Failed to parse storage event:', err);
          }
        }
      });
    }
  }

  public setRoomCode(code: string) {
    if (!code || this.currentRoomCode === code.toUpperCase()) return;
    this.currentRoomCode = code.toUpperCase();
    this.setupServerSync(this.currentRoomCode);
  }

  private setupServerSync(roomCode: string) {
    if (typeof window === 'undefined') return;

    // Close previous eventSource if any
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Attempt Server-Sent Events (SSE)
    try {
      this.eventSource = new EventSource(`/api/rooms/${roomCode}/sse`);
      
      this.eventSource.onmessage = (e) => {
        try {
          const data: RoomEvent = JSON.parse(e.data);
          if (data && data.type !== 'CONNECTED') {
            this.handleIncomingEvent(data);
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      this.eventSource.onerror = () => {
        // If SSE fails or disconnects, fallback to polling
        if (!this.pollInterval) {
          this.startPolling(roomCode);
        }
      };
    } catch (err) {
      this.startPolling(roomCode);
    }

    // Initial state fetch from server
    this.fetchRoomState(roomCode);
  }

  private startPolling(roomCode: string) {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      this.pollEvents(roomCode);
    }, 1500);
  }

  private async pollEvents(roomCode: string) {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/events?since=${this.lastPollTimestamp}`);
      if (res.ok) {
        const data = await res.json();
        this.lastPollTimestamp = data.timestamp || Date.now();
        if (Array.isArray(data.events)) {
          data.events.forEach((evt: RoomEvent) => this.handleIncomingEvent(evt));
        }
      }
    } catch (e) {
      // network quiet
    }
  }

  public async fetchRoomState(roomCode: string) {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/state`);
      if (res.ok) {
        const state = await res.json();
        return state;
      }
    } catch (e) {
      console.warn('Could not fetch room state:', e);
    }
    return null;
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

    // 3. HTTP Server API (Cross-Device / Cross-Network / Mobile Phones)
    if (this.currentRoomCode && typeof window !== 'undefined') {
      fetch(`/api/rooms/${this.currentRoomCode}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stampedEvent),
      }).catch((err) => console.warn('Server broadcast fallback error:', err));
    }

    this.notifyListeners(stampedEvent);
  }

  private handleIncomingEvent(event: RoomEvent) {
    if (!event || !event.type) return;

    // Check room code filter if available
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
