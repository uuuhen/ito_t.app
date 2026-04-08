import styles from './ResultScreen.module.css';

export default function ResultScreen({ result, isLeader, onReset, onLeave }) {
  const { success, orderedPlayers, correctOrder } = result;

  return (
    <div className={styles.shell}>
      <div className={styles.inner}>

        {/* ── Result banner ── */}
        <div className={styles.banner + ' anim-pop'} data-success={success}>
          <div className={styles.emoji}>{success ? '🎉' : '💔'}</div>
          <h1 className={styles.verdict}>
            {success ? '成功！' : '失敗...'}
          </h1>
          <p className={styles.verdictSub}>
            {success
              ? 'みんなで正しい順番に並べられた！すごい！'
              : '順番がどこか間違っていたみたい...'}
          </p>
        </div>

        {/* ── Submitted order ── */}
        <div className={styles.section + ' anim-fade-up'} style={{ animationDelay:'0.1s' }}>
          <h2 className={styles.sectionTitle}>提出した順番</h2>
          <div className={styles.playerCards}>
            {orderedPlayers.map((p, i) => {
              const isWrong = !success && i < orderedPlayers.length - 1
                && orderedPlayers[i].number > orderedPlayers[i + 1].number;
              return (
                <div
                  key={p.userId}
                  className={styles.playerCard + (isWrong ? ' ' + styles.wrong : '')}
                  style={{ animationDelay: `${0.05 * i + 0.1}s` }}
                >
                  <span className={styles.cardRank}>#{i + 1}</span>
                  <div className={styles.cardAvatar}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className={styles.cardInfo}>
                    <span className={styles.cardName}>{p.name}</span>
                  </div>
                  <div className={styles.cardNumber} data-wrong={isWrong}>
                    {p.number}
                  </div>
                  {isWrong && <span className={styles.wrongIcon}>✗</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Correct order (if failed) ── */}
        {!success && (
          <div className={styles.section + ' anim-fade-up'} style={{ animationDelay:'0.2s' }}>
            <h2 className={styles.sectionTitle}>正解の順番</h2>
            <div className={styles.playerCards}>
              {correctOrder.map((p, i) => (
                <div
                  key={p.userId}
                  className={styles.playerCard + ' ' + styles.correct}
                  style={{ animationDelay: `${0.05 * i + 0.2}s` }}
                >
                  <span className={styles.cardRank}>#{i + 1}</span>
                  <div className={styles.cardAvatar + ' ' + styles.avatarGreen}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className={styles.cardInfo}>
                    <span className={styles.cardName}>{p.name}</span>
                  </div>
                  <div className={styles.cardNumber + ' ' + styles.numberGreen}>
                    {p.number}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className={styles.actions + ' anim-fade-up'} style={{ animationDelay:'0.3s' }}>
          {isLeader ? (
            <>
              <button className="btn btn-primary" style={{ flex:1, padding:'14px' }} onClick={onReset}>
                🔄 もう一度遊ぶ
              </button>
              <button className="btn btn-ghost" style={{ flex:1, padding:'14px' }} onClick={onLeave}>
                🚪 ロビーへ
              </button>
            </>
          ) : (
            <div className={styles.waitReset}>
              <div className={styles.spinner} />
              <span>リーダーがリセットするまで待ってね...</span>
              <button className="btn btn-ghost" style={{ marginTop:8 }} onClick={onLeave}>退出する</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
