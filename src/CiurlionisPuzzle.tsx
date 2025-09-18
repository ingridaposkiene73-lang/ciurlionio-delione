import { useEffect, useMemo, useRef, useState } from 'react';

// ---- NUSTATYMAI ----
const DEFAULT_IMAGE =
  '/zodiakas_ciurlionis.jpg';
const BOARD_PX = 360; // lentos dydis px

// pagalbinės
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const isSolved = (p: number[]) => p.every((v, i) => v === i);
const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(
    2,
    '0'
  )}`;

export default function CiurlionisPuzzle() {
  // nustatymai
  const [size, setSize] = useState(3);
  const cells = useMemo(() => size * size, [size]);
  const piecePx = Math.floor(BOARD_PX / size);

  // vaizdas
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [urlInput, setUrlInput] = useState(DEFAULT_IMAGE);

  // būsena
  const [pieces, setPieces] = useState<number[]>(() => shuffle(range(9)));
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState(false);

  // drag & drop
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // mobilus „tap-tap“ sukeitimas
  const [firstTap, setFirstTap] = useState<number | null>(null);

  // laikmatis
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running]);

  // nauja dėlionė keičiant dydį
  useEffect(() => {
    newGame(size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const solved = isSolved(pieces);

  useEffect(() => {
    if (solved && running) {
      setRunning(false);
    }
  }, [solved, running]);

  function newGame(sz = size) {
    setPieces(shuffle(range(sz * sz)));
    setMoves(0);
    setSeconds(0);
    setRunning(false);
    setFirstTap(null);
  }

  function ensureTimer() {
    if (!running) setRunning(true);
  }

  // drag
  function onDragStart(e: React.DragEvent<HTMLDivElement>, from: number) {
    setDragIndex(from);
    e.dataTransfer.setData('text/plain', String(from));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>, to: number) {
    e.preventDefault();
    const from =
      dragIndex !== null
        ? dragIndex
        : Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(from) || from === to) return;

    ensureTimer();
    setPieces((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    setMoves((m) => m + 1);
    setDragIndex(null);
  }

  // tap-tap (mobilui)
  function onTapSwap(i: number) {
    if (firstTap === null) {
      setFirstTap(i);
      return;
    }
    if (firstTap === i) {
      setFirstTap(null);
      return;
    }
    ensureTimer();
    setPieces((prev) => {
      const next = [...prev];
      [next[firstTap], next[i]] = [next[i], next[firstTap]];
      return next;
    });
    setMoves((m) => m + 1);
    setFirstTap(null);
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Čiurlionio dėlionė 🧩</h2>

      {/* Valdikliai viršuje */}
      <div
        style={{
          marginBottom: 12,
          display: 'inline-flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <label>
          Tinklelis:
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            style={{ marginLeft: 6 }}
          >
            <option value={3}>3 × 3</option>
            <option value={4}>4 × 4</option>
            <option value={5}>5 × 5</option>
          </select>
        </label>

        <button onClick={() => newGame()}>Nauja</button>
        <button onClick={() => setPreview((p) => !p)}>
          {preview ? 'Slėpti peržiūrą' : 'Peržiūra'}
        </button>
      </div>

      {/* Statistika */}
      <div style={{ marginBottom: 10, fontSize: 14 }}>
        ⏱ {mmss(seconds)} &nbsp; • &nbsp; ėjimai: {moves}
        {solved && <strong style={{ marginLeft: 8 }}>🎉 Sudėta!</strong>}
      </div>

      {/* Įkelti kitą paveikslą */}
      <div style={{ marginBottom: 10 }}>
        <input
          style={{ width: 380, maxWidth: '90%' }}
          placeholder="Įklijuok paveikslo URL (JPG/PNG)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        <button
          style={{ marginLeft: 6 }}
          onClick={() => {
            setImageUrl(urlInput.trim() || DEFAULT_IMAGE);
            newGame();
          }}
        >
          Naudoti šį vaizdą
        </button>
      </div>

      {/* Lenta */}
      <div
        style={{
          width: BOARD_PX,
          height: BOARD_PX,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, ${piecePx}px)`,
          gridTemplateRows: `repeat(${size}, ${piecePx}px)`,
          gap: 2,
          border: '1px solid #aaa',
          position: 'relative',
          background: '#eee',
          userSelect: 'none',
        }}
      >
        {pieces.map((piece, i) => {
          const row = Math.floor(piece / size);
          const col = piece % size;
          return (
            <div
              key={i}
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, i)}
              onClick={() => onTapSwap(i)}
              style={{
                width: piecePx,
                height: piecePx,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${BOARD_PX}px ${BOARD_PX}px`,
                backgroundPosition: `-${col * piecePx}px -${row * piecePx}px`,
                border: '1px solid #999',
                boxSizing: 'border-box',
                cursor: 'grab',
                outline:
                  firstTap === i ? '3px solid #4ade80' : '1px solid #999',
              }}
              title="Tempk arba paliesk du langelius, kad sukeistum"
            />
          );
        })}

        {/* Peržiūros uždanga */}
        {preview && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.85,
              border: '2px dashed #333',
            }}
          />
        )}

        {/* Sveikinimas, kai išspręsta */}
        {solved && !preview && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.35)',
              color: 'white',
              fontSize: 22,
              fontWeight: 700,
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            }}
          >
            🎉 Sveikinimai! Dėlionė sudėta per {mmss(seconds)} • ėjimų: {moves}
          </div>
        )}
      </div>

      <p style={{ marginTop: 10, fontSize: 14 }}>
        Patarimas: tempk su pele (arba telefone paliesk du langelius paeiliui).
      </p>
    </div>
  );
}





