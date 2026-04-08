import { useState, useEffect, useRef, useCallback } from 'react';
import TopScreen from './screens/TopScreen';
import WaitingScreen from './screens/WaitingScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';

function generateUserId() {
  return 'u_' + Math.random().toString(36).slice(2, 11);
}

function getWsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  // In dev (vite), connect directly to server port 3001
  if (import.meta.env.DEV) return `ws://localhost:3001`;
  return `${proto}//${host}`;
}

export default function App() {
  const [screen, setScreen] = useState('TOP');
  const [userId] = useState(() => {
    const s = sessionStorage.getItem('ito_uid');
    if (s) return s;
    const id = generateUserId();
    sessionStorage.setItem('ito_uid', id);
    return id;
  });

  const [room, setRoom]             = useState(null);
  const [myNumber, setMyNumber]     = useState(null);
  const [chat, setChat]             = useState([]);
  const [proposedOrder, setProposed]= useState([]);
  const [gameResult, setGameResult] = useState(null);
  const [error, setError]           = useState(null);
  const [connected, setConnected]   = useState(false);

  const wsRef      = useRef(null);
  const reconnRef  = useRef(null);
  const pendingRef = useRef(null); // message to send after connect

  // ── WebSocket connect ────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return;

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      clearTimeout(reconnRef.current);
      if (pendingRef.current) {
        ws.send(JSON.stringify(pendingRef.current));
        pendingRef.current = null;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      const { type, payload } = msg;

      switch (type) {
        case 'ROOM_JOINED':
          setRoom(payload);
          setMyNumber(null);
          setChat([]);
          setGameResult(null);
          setProposed(payload.proposedOrder || []);
          setScreen('WAITING');
          setError(null);
          break;

        case 'ROOM_UPDATE':
          setRoom(payload);
          setProposed(payload.proposedOrder || []);
          break;

        case 'GAME_STARTED':
          setMyNumber(null);
          setChat([]);
          setGameResult(null);
          setProposed(payload.proposedOrder || []);
          setRoom(prev => ({
            ...prev,
            status: 'PLAYING',
            topic: payload.topic,
            players: payload.players,
            proposedOrder: payload.proposedOrder,
          }));
          setScreen('GAME');
          break;

        case 'YOUR_NUMBER':
          setMyNumber(payload.number);
          break;

        case 'CHAT_MSG':
          setChat(prev => [...prev, payload]);
          break;

        case 'ORDER_UPDATED':
          setProposed(payload.proposedOrder);
          setRoom(prev => prev ? { ...prev, proposedOrder: payload.proposedOrder } : prev);
          break;

        case 'GAME_RESULT':
          setGameResult(payload);
          setScreen('RESULT');
          break;

        case 'GAME_RESET':
          setRoom(payload);
          setMyNumber(null);
          setChat([]);
          setGameResult(null);
          setProposed(payload.proposedOrder || []);
          setScreen('WAITING');
          break;

        case 'ERROR':
          setError(payload.message);
          break;
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // ── Send helper ──────────────────────────────────────────────────
  const send = useCallback((type, payload) => {
    const msg = { type, payload };
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      pendingRef.current = msg;
      connect();
    }
  }, [connect]);

  // ── Actions ──────────────────────────────────────────────────────
  const actions = {
    createRoom: (name, roomId, maxPlayers) => {
      setError(null);
      send('CREATE_ROOM', { userId, name, roomId, maxPlayers });
    },
    joinRoom: (name, roomId) => {
      setError(null);
      send('JOIN_ROOM', { userId, name, roomId });
    },
    startGame: (topic) => {
      send('START_GAME', { userId, roomId: room?.roomId, topic });
    },
    sendChat: (message) => {
      send('CHAT', { userId, roomId: room?.roomId, message });
    },
    updateOrder: (newOrder) => {
      setProposed(newOrder);
      send('UPDATE_ORDER', { userId, roomId: room?.roomId, proposedOrder: newOrder });
    },
    submitOrder: () => {
      send('SUBMIT_ORDER', { userId, roomId: room?.roomId });
    },
    reset: () => {
      send('RESET', { userId, roomId: room?.roomId });
    },
    leave: () => {
      send('LEAVE', { userId, roomId: room?.roomId });
      setScreen('TOP');
      setRoom(null);
      setMyNumber(null);
      setChat([]);
      setGameResult(null);
    },
  };

  const isLeader = room?.leaderId === userId;

  return (
    <>
      {!connected && screen !== 'TOP' && (
        <div style={{
          position:'fixed', top:0, left:0, right:0,
          background:'rgba(255,71,87,0.9)', color:'#fff',
          textAlign:'center', padding:'8px', fontSize:'13px',
          fontWeight:700, zIndex:9999,
        }}>
          🔄 サーバーに再接続中...
        </div>
      )}

      {screen === 'TOP' && (
        <TopScreen
          error={error}
          onCreateRoom={actions.createRoom}
          onJoinRoom={actions.joinRoom}
        />
      )}
      {screen === 'WAITING' && room && (
        <WaitingScreen
          room={room}
          userId={userId}
          isLeader={isLeader}
          error={error}
          onStart={actions.startGame}
          onLeave={actions.leave}
        />
      )}
      {screen === 'GAME' && room && (
        <GameScreen
          room={room}
          userId={userId}
          isLeader={isLeader}
          myNumber={myNumber}
          chat={chat}
          proposedOrder={proposedOrder}
          onSendChat={actions.sendChat}
          onUpdateOrder={actions.updateOrder}
          onSubmitOrder={actions.submitOrder}
          onLeave={actions.leave}
        />
      )}
      {screen === 'RESULT' && gameResult && (
        <ResultScreen
          result={gameResult}
          isLeader={isLeader}
          onReset={actions.reset}
          onLeave={actions.leave}
        />
      )}
    </>
  );
}
