export type LyricLine = { text: string; start: number; end: number };

export function parseLRC(text: string, durationSec?: number | null): LyricLine[] {
  const timed: Array<{ text: string; start: number }> = [];
  const plain: string[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    // Match one or more [mm:ss] / [mm:ss.xx] / [mm:ss.xxx] tags at start of line
    const tagRegex = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    const matches = [...line.matchAll(tagRegex)];
    if (matches.length > 0) {
      const content = line.replace(tagRegex, "").trim();
      if (!content) continue;
      for (const m of matches) {
        let ms = (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) * 1000;
        const frac = m[3] ?? "";
        if (frac.length === 3) ms += parseInt(frac, 10);
        else if (frac.length === 2) ms += parseInt(frac, 10) * 10;
        else if (frac.length === 1) ms += parseInt(frac, 10) * 100;
        timed.push({ text: content.slice(0, 300), start: ms });
      }
    } else if (!/^\[[a-zA-Z]+:.*\]$/.test(line)) {
      plain.push(line.slice(0, 300));
    }
  }

  if (timed.length > 0) {
    timed.sort((a, b) => a.start - b.start);
    return timed.slice(0, 300).map((l, i) => ({
      text: l.text,
      start: l.start,
      end: timed[i + 1]?.start ?? l.start + 4000,
    }));
  }

  if (plain.length === 0) return [];

  // Auto-pace plain text lyrics evenly across duration (or 3.5s per line)
  const limited = plain.slice(0, 300);
  const totalMs =
    typeof durationSec === "number" && Number.isFinite(durationSec) && durationSec > 5
      ? durationSec * 1000
      : limited.length * 3500;
  const stepMs = Math.max(1500, Math.round(totalMs / limited.length));

  return limited.map((content, i) => {
    const start = i * stepMs;
    return {
      text: content,
      start,
      end: start + stepMs,
    };
  });
}

export function toLRC(lines: LyricLine[] | null | undefined): string {
  if (!lines?.length) return "";
  return lines
    .map((l) => {
      const total = Math.max(0, Math.round(l.start));
      const m = Math.floor(total / 60000);
      const s = Math.floor((total % 60000) / 1000);
      const cs = Math.floor((total % 1000) / 10);
      return `[${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}] ${l.text}`;
    })
    .join("\n");
}
