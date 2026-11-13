import { useEffect, useState } from 'react';
import { copy, t } from '../lib/copy';
import { useScenario, type Reply } from '../lib/store';
import { Orb } from './Orb';

const FADE_MS = 12000;

/** Message bubbles above the composer: max 3, newest last, fade after 12 s unless hovered. */
export function Replies({ raised }: { raised: boolean }) {
  const replies = useScenario((s) => s.replies);
  const [hovered, setHovered] = useState(false);
  return (
    <div className={`replies${raised ? ' is-raised' : ''}`} aria-live="polite" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      {replies.map((r) => <Bubble key={r.id} reply={r} paused={hovered} />)}
    </div>
  );
}

function Bubble({ reply, paused }: { reply: Reply; paused: boolean }) {
  const dismiss = useScenario((s) => s.dismissReply);
  useEffect(() => {
    if (reply.thinking || paused) return;
    const id = window.setTimeout(() => dismiss(reply.id), FADE_MS);
    return () => window.clearTimeout(id);
  }, [reply.thinking, reply.id, paused, dismiss]);

  return (
    <div className={`pmr-glass bubble${reply.thinking ? ' is-thinking' : ''}`}>
      {reply.role === 'bob' ? <span className="bubble__bob" aria-hidden="true" /> : <Orb role={reply.role} size={20} />}
      <div className="bubble__text">
        <span className="bubble__name">{reply.speaker}</span>
        <span className="bubble__body">{reply.thinking ? t(copy.constellation.thinking, { agent: reply.speaker }) : reply.text}</span>
      </div>
    </div>
  );
}
