import { useState, useRef, useEffect } from 'react';
import styles from './GameScreen.module.css';

export default function GameScreen({
  room, userId, isLeader, myNumber,
  chat, proposedOrder,
  onSendChat, onUpdateOrder, onSubmitOrder, onLeave,
}) {
  const [msg, setMsg]         = useState('');
  const [dragIdx, setDragIdx] = useState(null);
  const [phase, setPhase]     = useState('chat'); // 'chat' | 'order'
  const chatEndRef            = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const sendMsg = () => {
    const text = msg.trim();
    if (!text) return;
    onSendChat(text);
    setMsg('');
  };

  // ── Drag & Drop ──────────────────────────────────────────────────
  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newOrder = [...proposedOrder];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    setDragIdx(idx);
    onUpdateOrder(newOrder);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragIdx(null);
  };

  // Move up/down buttons (mobile-friendly)
  const moveItem = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= proposedOrder.length) return;
    const newOrder = [...proposedOrder];
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    onUpdateOrder(newOrder);
  };

  const getPlayer = (uid) => room.players.find(p => p.userId === uid);

  return (
    <div className={styles.shell}>

      {/* ── Top bar ── */}
      <div className={styles.topbar}>
        <button className="btn btn-ghost" style={{ padding:'7px 12px', fontSize:'12px' }} onClick={onLeave}>
          ← 退出
        </button>
        <div className={styles.topicBadge}>
          <span className={styles.topicLabel}>テーマ</span>
          <span className={styles.topicText}>{room.topic}</span>
        </div>
        <div style={{ width:64 }} />
      </div>

      {/* ── My number card ── */}
      <div className={styles.numberSection + ' anim-pop'}>
        <div className={styles.numberCard}>
          <span className={styles.numberLabel}>あなたの数字</span>
          {myNumber !== null ? (
            <span className={styles.numberValue}>{myNumber}</span>
          ) : (
            <div className={styles.numberSkeleton} />
          )}
          <span className={styles.numberHint}>数字を直接言わないでね！</span>
        </div>
      </div>

      {/* ── Phase tabs ── */}
      <div className={styles.phaseTabs}>
        <button
          className={styles.phaseTab + (phase === 'chat' ? ' ' + styles.phaseActive : '')}
          onClick={() => setPhase('chat')}
        >
          💬 ヒント発言
          {chat.length > 0 && <span className={styles.badge}>{chat.length}</span>}
        </button>
        <button
          className={styles.phaseTab + (phase === 'order' ? ' ' + styles.phaseActive : '')}
          onClick={() => setPhase('order')}
        >
          🔢 順番を決める
        </button>
      </div>

      {/* ── Chat panel ── */}
      {phase === 'chat' && (
        <div className={styles.panel + ' anim-fade-up'}>
          <div className={styles.chatLog}>
            {chat.length === 0 && (
              <div className={styles.chatEmpty}>
                <p>テーマ「<strong>{room.topic}</strong>」に沿った<br />ヒントを言い合おう！</p>
                <p style={{ fontSize:'11px', marginTop:6 }}>※ 数字は直接言えません</p>
              </div>
            )}
            {chat.map((c, i) => (
              <div
                key={i}
                className={styles.chatMsg + (c.userId === userId ? ' ' + styles.chatMine : '')}
              >
                {c.userId !== userId && (
                  <div className={styles.chatName}>{c.name}</div>
                )}
                <div className={styles.chatBubble}>{c.message}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className={styles.chatInput}>
            <input
              className="input"
              style={{ flex:1 }}
              placeholder="テーマに沿ったヒントを入力..."
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              maxLength={200}
            />
            <button
              className="btn btn-primary"
              style={{ padding:'12px 20px', flexShrink:0 }}
              onClick={sendMsg}
              disabled={!msg.trim()}
            >送信</button>
          </div>
        </div>
      )}

      {/* ── Order panel ── */}
      {phase === 'order' && (
        <div className={styles.panel + ' anim-fade-up'}>
          <p className={styles.orderInstruction}>
            ドラッグ（PC）または ↑↓ ボタンで<br />
            <strong>小さい数字が上</strong>になるよう並び替えよう
          </p>

          <div className={styles.orderList}>
            {proposedOrder.map((uid, idx) => {
              const p = getPlayer(uid);
              if (!p) return null;
              const isMe = uid === userId;
              return (
                <div
                  key={uid}
                  className={styles.orderItem + (dragIdx === idx ? ' ' + styles.dragging : '')}
                  draggable
                  onDragStart={e => handleDragStart(e, idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                >
                  <span className={styles.orderRank}>{idx + 1}</span>
                  <div className={styles.orderAvatar}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span className={styles.orderName}>
                    {p.name}
                    {isMe && <span className={styles.youTag}>あなた</span>}
                  </span>
                  <div className={styles.orderBtns}>
                    <button
                      className={styles.arrowBtn}
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                    >▲</button>
                    <button
                      className={styles.arrowBtn}
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === proposedOrder.length - 1}
                    >▼</button>
                  </div>
                </div>
              );
            })}
          </div>

          {isLeader && (
            <button
              className="btn btn-teal"
              style={{ width:'100%', padding:'16px', fontSize:'16px', marginTop:16 }}
              onClick={onSubmitOrder}
            >
              ✅ 判定する！
            </button>
          )}
          {!isLeader && (
            <p className={styles.waitLeader}>
              👑 リーダーが判定するまで待ってね
            </p>
          )}
        </div>
      )}
    </div>
  );
}
