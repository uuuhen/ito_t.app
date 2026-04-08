import { useState } from 'react';
import styles from './WaitingScreen.module.css';

export default function WaitingScreen({ room, userId, isLeader, error, onStart, onLeave }) {
  const [topic, setTopic] = useState('');

  const playerCount = room.players.length;
  const progress = (playerCount / room.maxPlayers) * 100;

  return (
    <div className={styles.shell}>
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header + ' anim-fade-up'}>
          <button className="btn btn-ghost" style={{ padding:'8px 12px', fontSize:'12px' }} onClick={onLeave}>
            ← 戻る
          </button>
          <div className={styles.roomBadge}>
            <span className={styles.roomLabel}>ROOM</span>
            <span className={styles.roomId}>{room.roomId}</span>
          </div>
        </div>

        {/* Title */}
        <div className={styles.titleArea + ' anim-fade-up'} style={{ animationDelay:'0.05s' }}>
          <h1 className={styles.title}>ito</h1>
          <p className={styles.subtitle}>メンバーの参加を待っています...</p>
        </div>

        {/* Player list */}
        <div className={styles.card + ' anim-fade-up'} style={{ animationDelay:'0.1s' }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>プレイヤー</span>
            <span className={styles.countBadge}>{playerCount} / {room.maxPlayers}</span>
          </div>

          {/* Progress bar */}
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width:`${progress}%` }} />
          </div>

          <div className={styles.playerList}>
            {room.players.map((p, i) => (
              <div
                key={p.userId}
                className={styles.playerRow}
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <div className={styles.playerAvatar}>
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
                <span className={styles.playerName}>{p.name}</span>
                <div className={styles.playerTags}>
                  {p.userId === userId && (
                    <span className={styles.youTag}>あなた</span>
                  )}
                  {p.userId === room.leaderId && (
                    <span className={styles.leaderTag}>👑 リーダー</span>
                  )}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: room.maxPlayers - playerCount }).map((_, i) => (
              <div key={i} className={styles.emptySlot}>
                <div className={styles.emptyIcon}>＋</div>
                <span className={styles.emptyText}>待機中...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leader controls */}
        {isLeader ? (
          <div className={styles.card + ' anim-fade-up'} style={{ animationDelay:'0.15s' }}>
            <div className={styles.cardTitle} style={{ marginBottom:16 }}>ゲーム設定</div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label className="label">テーマ（空欄でランダム）</label>
                <input
                  className="input"
                  placeholder="例：速いもの、高価なもの..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  maxLength={30}
                />
              </div>
              {error && <div className="error-msg">{error}</div>}
              <button
                className="btn btn-primary"
                style={{ width:'100%', padding:'16px', fontSize:'16px' }}
                onClick={() => onStart(topic.trim())}
                disabled={playerCount < 2}
              >
                🎮 ゲームスタート！
              </button>
              {playerCount < 2 && (
                <p style={{ color:'var(--text3)', fontSize:'12px', textAlign:'center' }}>
                  あと {2 - playerCount} 人必要です
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.waitCard + ' anim-fade-up'} style={{ animationDelay:'0.15s' }}>
            <div className={styles.spinner} />
            <p>リーダーがゲームを開始するまで待ってください</p>
            <p style={{ fontSize:'12px', color:'var(--text3)', marginTop:4 }}>
              ルームID: <strong style={{ color:'var(--text)', fontFamily:'var(--font-mono)' }}>{room.roomId}</strong> を他のメンバーに共有しよう
            </p>
          </div>
        )}

        {/* Share hint */}
        <div className={styles.shareHint + ' anim-fade-up'} style={{ animationDelay:'0.2s' }}>
          <span>📋</span>
          <span>ルームID <strong style={{ fontFamily:'var(--font-mono)', color:'var(--accent)' }}>{room.roomId}</strong> を友達に教えよう</span>
        </div>

      </div>
    </div>
  );
}
