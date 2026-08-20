import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface RoomClient {
  res: express.Response;
  id: string;
}

interface RoomData {
  code: string;
  heroes: any[];
  boss?: any;
  phase?: string;
  screenState?: string;
  isGoClicked?: boolean;
  currentTurn?: number;
  events: any[];
  clients: RoomClient[];
  updatedAt: number;
}

const rooms: Record<string, RoomData> = {};

function getOrCreateRoom(code: string): RoomData {
  const normalizedCode = (code || 'GLOBAL').toUpperCase();
  if (!rooms[normalizedCode]) {
    rooms[normalizedCode] = {
      code: normalizedCode,
      heroes: [],
      events: [],
      clients: [],
      updatedAt: Date.now(),
    };
  }
  return rooms[normalizedCode];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get Room State
  app.get('/api/rooms/:code/state', (req, res) => {
    const room = getOrCreateRoom(req.params.code);
    res.json({
      code: room.code,
      heroes: room.heroes,
      boss: room.boss,
      phase: room.phase,
      screenState: room.screenState || 'PREPARATION',
      isGoClicked: room.isGoClicked || false,
      currentTurn: room.currentTurn,
      updatedAt: room.updatedAt,
    });
  });

  // Broadcast Event to Room
  app.post('/api/rooms/:code/event', (req, res) => {
    const room = getOrCreateRoom(req.params.code);
    const event = req.body;
    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid event payload' });
    }

    const stampedEvent = {
      ...event,
      roomCode: room.code,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };

    // Update server-side room data if it's player join or host sync
    if (event.type === 'PLAYER_JOIN' && event.payload?.hero) {
      const existingIdx = room.heroes.findIndex((h) => h.id === event.payload.hero.id);
      if (existingIdx >= 0) {
        room.heroes[existingIdx] = event.payload.hero;
      } else if (room.heroes.length < 6) {
        room.heroes.push(event.payload.hero);
      }
    } else if (event.type === 'PLAYER_REMOVE' && event.payload?.heroId) {
      room.heroes = room.heroes.filter((h) => h.id !== event.payload.heroId);
    } else if (event.type === 'PLAYER_LOCK_IN' && event.payload?.heroId) {
      const hero = room.heroes.find((h) => h.id === event.payload.heroId);
      if (hero) {
        hero.selectedCardIds = event.payload.selectedCardIds || [];
        hero.isReady = true;
      }
    } else if (event.type === 'HOST_SYNC' && event.payload) {
      if (Array.isArray(event.payload.heroes)) {
        room.heroes = event.payload.heroes;
      }
      if (event.payload.boss) room.boss = event.payload.boss;
      if (event.payload.phase) room.phase = event.payload.phase;
      if (event.payload.screenState) room.screenState = event.payload.screenState;
      if (event.payload.isGoClicked !== undefined) room.isGoClicked = event.payload.isGoClicked;
      if (event.payload.currentTurn !== undefined) room.currentTurn = event.payload.currentTurn;
    }

    room.events.push(stampedEvent);
    if (room.events.length > 100) {
      room.events.shift();
    }
    room.updatedAt = Date.now();

    // Push to all SSE clients in this room
    const dataStr = `data: ${JSON.stringify(stampedEvent)}\n\n`;
    room.clients.forEach((client) => {
      try {
        client.res.write(dataStr);
      } catch (err) {
        // client disconnected
      }
    });

    res.json({ success: true, event: stampedEvent });
  });

  // Get recent events (Polling fallback)
  app.get('/api/rooms/:code/events', (req, res) => {
    const room = getOrCreateRoom(req.params.code);
    const since = parseInt(req.query.since as string, 10) || 0;
    const newEvents = room.events.filter((e) => e.timestamp > since);
    res.json({
      events: newEvents,
      heroes: room.heroes,
      boss: room.boss,
      phase: room.phase,
      screenState: room.screenState || 'PREPARATION',
      isGoClicked: room.isGoClicked || false,
      currentTurn: room.currentTurn,
      timestamp: Date.now(),
    });
  });

  // Real-time SSE Stream
  app.get('/api/rooms/:code/sse', (req, res) => {
    const room = getOrCreateRoom(req.params.code);
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, roomCode: room.code, timestamp: Date.now() })}\n\n`);

    const client: RoomClient = { res, id: clientId };
    room.clients.push(client);

    req.on('close', () => {
      room.clients = room.clients.filter((c) => c.id !== clientId);
    });
  });

  // Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Boss Card Game Server running on port ${PORT}`);
  });
}

startServer();
