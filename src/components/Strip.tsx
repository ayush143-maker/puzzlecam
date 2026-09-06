"use client";

import { memo } from "react";

type Props = {
  shots: string[];
  complete: boolean;
  onDownload: () => void;
  onReset: () => void;
};

function StripBase({ shots, complete, onDownload, onReset }: Props) {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h2 className="text-[11px] tracking-[0.25em] text-paper/80">TIRA</h2>
        <span className="text-[11px] text-signal">{shots.length} / 3</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {shots.length === 0 && (
          <p className="border border-dashed border-line p-3 text-[11px] leading-relaxed text-paper/50">
            Tus rompecabezas completados aparecerán aquí.
          </p>
        )}
        {shots.map((s, i) => (
          <figure key={i} className="border border-line bg-paper p-1.5">
            <img src={s} alt={`foto ${i + 1}`} className="w-full" />
            <figcaption className="pt-1 text-right text-[10px] text-ink/60">
              00{i + 1}
            </figcaption>
          </figure>
        ))}
        {complete && (
          <p className="border border-ok/40 bg-ok/10 p-3 text-[11px] leading-relaxed text-ok">
            tira completa — descarga o reinicia para seguir
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-line p-4">
        <button
          disabled={!complete}
          onClick={onDownload}
          className="w-full border border-line px-3 py-2 text-[10px] tracking-[0.25em] text-paper/80 enabled:border-signal enabled:text-signal enabled:hover:bg-signal enabled:hover:text-ink disabled:opacity-40"
        >
          DESCARGAR TIRA
        </button>
        <button
          onClick={onReset}
          className="w-full border border-line px-3 py-2 text-[10px] tracking-[0.25em] text-paper/60 hover:border-bad hover:text-bad"
        >
          REINICIAR TODO
        </button>
      </div>
    </aside>
  );
}

export default memo(StripBase);
