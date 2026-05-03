import { useEffect, useRef } from 'react';
import type { LogEntry } from '../game/types';
import { ROOM_IMAGES } from '../game/roomImages';

interface Props {
  log: LogEntry[];
  chaos: number;
}

function glitchText(text: string, chaos: number): string {
  if (chaos < 90) return text;
  const chars = '!@#$%^&*░▒▓';
  return text.split('').map(c =>
    Math.random() < 0.03 ? chars[Math.floor(Math.random() * chars.length)] : c
  ).join('');
}

export function GameLog({ log, chaos }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="game-log">
      {log.map(entry => (
        <div key={entry.id}>
          {entry.type === 'room' && entry.roomId && ROOM_IMAGES[entry.roomId] && (
            <div className="room-art-frame">
              <img
                className="room-art"
                src={ROOM_IMAGES[entry.roomId]}
                alt=""
              />
            </div>
          )}
          <pre className={`log-entry log-${entry.type}`}>
            {chaos >= 90 ? glitchText(entry.text, chaos) : entry.text}
          </pre>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
