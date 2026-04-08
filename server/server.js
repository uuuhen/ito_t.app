const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve built client in production
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ── In-memory state ──────────────────────────────────────────────────────────
const rooms = new Map();   // roomId -> Room
const clients = new Map(); // ws -> { userId, roomId, name }

// ── Helpers ──────────────────────────────────────────────────────────────────
function sanitize(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastRoom(roomId, data, excludeWs = null) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(ws => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const c = clients.get(ws);
    if (c && c.roomId === roomId && ws !== excludeWs) {
      ws.send(msg);
    }
  });
}

function sendToUser(userId, data) {
  wss.clients.forEach(ws => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const c = clients.get(ws);
    if (c && c.userId === userId) send(ws, data);
  });
}

function publicRoom(room) {
  return {
    roomId: room.roomId,
    leaderId: room.leaderId,
    status: room.status,
    maxPlayers: room.maxPlayers,
    topic: room.topic,
    players: room.players.map(p => ({
      userId: p.userId,
      name: p.name,
    })),
    proposedOrder: room.proposedOrder,
  };
}

function removePlayer(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.players = room.players.filter(p => p.userId !== userId);
  room.proposedOrder = room.proposedOrder.filter(id => id !== userId);
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return;
  }
  if (room.leaderId === userId) {
    room.leaderId = room.players[0].userId;
  }
  broadcastRoom(roomId, { type: 'ROOM_UPDATE', payload: publicRoom(room) });
}

// ── Default topics ────────────────────────────────────────────────────────────
const DEFAULT_TOPICS = [
  '人気な食べ物', '強いキャラクター', '行きたい国', '有名な企業',
  'モテる職業', '怖い動物', '速いもの', '高価なもの',
  '難しい試験', '楽しいイベント', '大きな生き物', '歴史上の偉人',
];

// ── WebSocket handler ─────────────────────────────────────────────────────────
wss.on('connection', ws => {
  clients.set(ws, { userId: null, roomId: null, name: null });

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const { type, payload = {} } = msg;

    switch (type) {

      // ── CREATE_ROOM ──────────────────────────────────────────────────────
      case 'CREATE_ROOM': {
        const { userId, name, roomId, maxPlayers } = payload;
        if (!userId || !roomId) return;
        if (!/^[a-zA-Z0-9]{4,10}$/.test(roomId)) {
          return send(ws, { type: 'ERROR', payload: { message: 'ルームIDは英数字4〜10文字にしてください' } });
        }
        if (rooms.has(roomId)) {
          return send(ws, { type: 'ERROR', payload: { message: 'そのルームIDは既に使われています' } });
        }
        const safeName = sanitize(name || `Player${Math.floor(Math.random() * 9000 + 1000)}`);
        const room = {
          roomId,
          leaderId: userId,
          status: 'WAITING',
          maxPlayers: Math.min(10, Math.max(2, parseInt(maxPlayers) || 10)),
          players: [{ userId, name: safeName, number: null }],
          topic: null,
          chat: [],
          proposedOrder: [userId],
        };
        rooms.set(roomId, room);
        clients.set(ws, { userId, roomId, name: safeName });
        send(ws, { type: 'ROOM_JOINED', payload: publicRoom(room) });
        break;
      }

      // ── JOIN_ROOM ────────────────────────────────────────────────────────
      case 'JOIN_ROOM': {
        const { userId, name, roomId } = payload;
        if (!userId || !roomId) return;
        const room = rooms.get(roomId);
        if (!room) {
          return send(ws, { type: 'ERROR', payload: { message: 'ルームが見つかりません' } });
        }
        if (room.status !== 'WAITING') {
          return send(ws, { type: 'ERROR', payload: { message: 'ゲームは既に開始されています' } });
        }
        const alreadyIn = room.players.find(p => p.userId === userId);
        if (!alreadyIn && room.players.length >= room.maxPlayers) {
          return send(ws, { type: 'ERROR', payload: { message: 'ルームが満員です' } });
        }
        const safeName = sanitize(name || `Player${Math.floor(Math.random() * 9000 + 1000)}`);
        if (!alreadyIn) {
          room.players.push({ userId, name: safeName, number: null });
          room.proposedOrder.push(userId);
        }
        clients.set(ws, { userId, roomId, name: safeName });
        send(ws, { type: 'ROOM_JOINED', payload: publicRoom(room) });
        broadcastRoom(roomId, { type: 'ROOM_UPDATE', payload: publicRoom(room) }, ws);
        break;
      }

      // ── START_GAME ───────────────────────────────────────────────────────
      case 'START_GAME': {
        const { userId, roomId, topic } = payload;
        const room = rooms.get(roomId);
        if (!room || room.leaderId !== userId) return;
        if (room.players.length < 2) {
          return send(ws, { type: 'ERROR', payload: { message: 'プレイヤーが2人以上必要です' } });
        }
        // Assign unique numbers 1-99
        const nums = shuffle(Array.from({ length: 99 }, (_, i) => i + 1));
        room.players.forEach((p, i) => { p.number = nums[i]; });

        const chosenTopic = (topic && topic.trim())
          ? sanitize(topic.trim())
          : DEFAULT_TOPICS[Math.floor(Math.random() * DEFAULT_TOPICS.length)];

        room.topic = chosenTopic;
        room.status = 'PLAYING';
        room.chat = [];
        room.proposedOrder = room.players.map(p => p.userId);

        // Send each player their own number privately
        room.players.forEach(p => {
          sendToUser(p.userId, { type: 'YOUR_NUMBER', payload: { number: p.number } });
        });

        // Broadcast game start (no numbers)
        broadcastRoom(roomId, {
          type: 'GAME_STARTED',
          payload: {
            topic: room.topic,
            players: room.players.map(p => ({ userId: p.userId, name: p.name })),
            proposedOrder: room.proposedOrder,
          },
        });
        break;
      }

      // ── CHAT ─────────────────────────────────────────────────────────────
      case 'CHAT': {
        const { userId, roomId, message } = payload;
        const room = rooms.get(roomId);
        if (!room || room.status !== 'PLAYING') return;
        const player = room.players.find(p => p.userId === userId);
        if (!player) return;
        const chatMsg = {
          userId,
          name: player.name,
          message: sanitize(String(message).slice(0, 200)),
          timestamp: Date.now(),
        };
        room.chat.push(chatMsg);
        if (room.chat.length > 200) room.chat.shift();
        broadcastRoom(roomId, { type: 'CHAT_MSG', payload: chatMsg });
        break;
      }

      // ── UPDATE_ORDER ─────────────────────────────────────────────────────
      case 'UPDATE_ORDER': {
        const { userId, roomId, proposedOrder } = payload;
        const room = rooms.get(roomId);
        if (!room || room.status !== 'PLAYING') return;
        // Validate order contains same player IDs
        const playerIds = new Set(room.players.map(p => p.userId));
        if (!Array.isArray(proposedOrder)) return;
        if (proposedOrder.length !== room.players.length) return;
        if (!proposedOrder.every(id => playerIds.has(id))) return;
        room.proposedOrder = proposedOrder;
        broadcastRoom(roomId, { type: 'ORDER_UPDATED', payload: { proposedOrder } }, ws);
        send(ws, { type: 'ORDER_UPDATED', payload: { proposedOrder } });
        break;
      }

      // ── SUBMIT_ORDER ─────────────────────────────────────────────────────
      case 'SUBMIT_ORDER': {
        const { userId, roomId } = payload;
        const room = rooms.get(roomId);
        if (!room || room.leaderId !== userId || room.status !== 'PLAYING') return;

        const ordered = room.proposedOrder.map(uid => room.players.find(p => p.userId === uid));
        let success = true;
        for (let i = 0; i < ordered.length - 1; i++) {
          if (ordered[i].number > ordered[i + 1].number) { success = false; break; }
        }

        room.status = 'RESULT';
        const correctOrder = [...room.players].sort((a, b) => a.number - b.number);

        broadcastRoom(roomId, {
          type: 'GAME_RESULT',
          payload: {
            success,
            orderedPlayers: ordered.map(p => ({ userId: p.userId, name: p.name, number: p.number })),
            correctOrder: correctOrder.map(p => ({ userId: p.userId, name: p.name, number: p.number })),
          },
        });
        break;
      }

      // ── RESET ────────────────────────────────────────────────────────────
      case 'RESET': {
        const { userId, roomId } = payload;
        const room = rooms.get(roomId);
        if (!room || room.leaderId !== userId) return;
        room.status = 'WAITING';
        room.topic = null;
        room.chat = [];
        room.players.forEach(p => { p.number = null; });
        room.proposedOrder = room.players.map(p => p.userId);
        broadcastRoom(roomId, { type: 'GAME_RESET', payload: publicRoom(room) });
        break;
      }

      // ── LEAVE ────────────────────────────────────────────────────────────
      case 'LEAVE': {
        const c = clients.get(ws);
        if (c && c.roomId) removePlayer(c.roomId, c.userId);
        clients.set(ws, { userId: null, roomId: null, name: null });
        break;
      }
    }
  });

  ws.on('close', () => {
    const c = clients.get(ws);
    if (c && c.roomId) removePlayer(c.roomId, c.userId);
    clients.delete(ws);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🎮 Ito server listening on http://localhost:${PORT}`));
