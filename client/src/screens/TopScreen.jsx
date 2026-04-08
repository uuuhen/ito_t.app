import { useState } from 'react';
import styles from './TopScreen.module.css';

export default function TopScreen({ error, onCreateRoom, onJoinRoom }) {
  const [tab, setTab]         = useState('join'); // 'create' | 'join'
  const [name, setName]       = useState('');
  const [roomId, setRoomId]   = useState('');
  const [maxP, setMaxP]       = useState(10);

  const handleSubmit = () => {
    if (tab === 'create') {
      onCreateRoom(name.trim(), roomId.trim(), maxP);
    } else {
      onJoinRoom(name.trim(), roomId.trim());
    }
  };

  const canSubmit = roomId.trim().length >= 4;

  return (
    <div className={styles.shell}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.logo}>
          <span className={styles.logoIto}>ito</span>
          <span className={styles.logoDot}>●</span>
        </div>
        <p className={styles.tagline}>数字で語る、心をつなぐ協力ゲーム</p>
      </div>

      {/* Card */}
      <div className={styles.card + ' anim-fade-up'}>
        {/* Tab */}
        <div className={styles.tabs}>
          <button
            className={styles.tab + (tab === 'join' ? ' ' + styles.tabActive : '')}
            onClick={() => setTab('join')}
          >参加する</button>
          <button
            className={styles.tab + (tab === 'create' ? ' ' + styles.tabActive : '')}
            onClick={() => setTab('create')}
          >作成する</button>
        </div>

        {/* Fields */}
        <div className={styles.fields}>
          <div>
            <label className="label">プレイヤー名</label>
            <input
              className="input"
              placeholder="未入力でランダム生成"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div>
            <label className="label">ルームID（英数字 4〜10文字）</label>
            <input
              className="input"
              placeholder="例：abc123"
              value={roomId}
              onChange={e => setRoomId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10))}
            />
          </div>

          {tab === 'create' && (
            <div>
              <label className="label">最大人数（2〜10人）</label>
              <div className={styles.rangeRow}>
                <input
                  type="range" min={2} max={10} value={maxP}
                  onChange={e => setMaxP(Number(e.target.value))}
                  className={styles.range}
                />
                <span className={styles.rangeVal}>{maxP}人</span>
              </div>
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {tab === 'create' ? '🎮 ルームを作成' : '🚀 ルームに参加'}
          </button>
        </div>
      </div>

      {/* How to play */}
      <div className={styles.howto + ' anim-fade-up'} style={{ animationDelay: '0.1s' }}>
        <h3 className={styles.howtoTitle}>遊び方</h3>
        <ol className={styles.steps}>
          <li><span className={styles.stepNum}>1</span><span>各プレイヤーに <strong>1〜99</strong> のランダムな数字が配られる</span></li>
          <li><span className={styles.stepNum}>2</span><span>共通の<strong>テーマ</strong>が発表される</span></li>
          <li><span className={styles.stepNum}>3</span><span>数字を言わずに、テーマに沿ったヒントを<strong>チャット</strong>で伝える</span></li>
          <li><span className={styles.stepNum}>4</span><span>全員で<strong>昇順</strong>に並ぶよう、順番を話し合いで決める</span></li>
          <li><span className={styles.stepNum}>5</span><span>リーダーが<strong>判定</strong>！全員の数字が昇順なら<strong>成功</strong>🎉</span></li>
        </ol>
      </div>
    </div>
  );
}
