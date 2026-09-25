import { useState } from 'react';
import type { DialogueLine, Locale } from '../domain/types';

const SPEAKER_NAME: Record<DialogueLine['speaker'], string> = {
  ECHO: 'ECHO',
  SHADOW: '???',
};

const HINT: Record<Locale, string> = {
  en: 'Tap to continue',
  id: 'Ketuk untuk lanjut',
};

export function DialogueOverlay({
  lines,
  locale,
  onComplete,
}: {
  lines: DialogueLine[];
  locale: Locale;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const line = lines[index];

  const advance = () => {
    if (index + 1 < lines.length) {
      setIndex(index + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="dialogue-overlay" role="button" tabIndex={0} onClick={advance} onKeyDown={(e) => e.key === 'Enter' && advance()}>
      <div className="dialogue-box">
        <div className={`dialogue-speaker ${line.speaker === 'ECHO' ? 'echo' : 'shadow'}`}>{SPEAKER_NAME[line.speaker]}</div>
        <div className="dialogue-text">{line.text}</div>
        <div className="dialogue-hint">{HINT[locale]} ({index + 1}/{lines.length})</div>
      </div>
    </div>
  );
}
