import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ingredient {
  id: number;
  x: number;
  y: number;
  emoji: string;
  name: string;
  isBomb: boolean;
  speed: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

interface StackedLayer {
  emoji: string;
  name: string;
}

type GameState = 'IDLE' | 'PLAYING' | 'GAME_OVER';

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 360;
const CANVAS_H = 500;
const CATCHER_W = 80;
const CATCHER_H = 20;
const CATCHER_Y = CANVAS_H - 40;
const CATCHER_SPEED = 8;
const INGREDIENT_SIZE = 36;
const LIVES_MAX = 3;
const SCORE_PER_POINT = 100;
const MAX_GAME_POINTS = 20;
const LEVEL_UP_EVERY = 5;
const BASE_FALL_SPEED = 2.2;
const SPEED_MULTIPLIER = 1.25;

const GOOD_INGREDIENTS = [
  { emoji: '🥩', name: 'Patty' },
  { emoji: '🧀', name: 'Cheese' },
  { emoji: '🥬', name: 'Lettuce' },
  { emoji: '🍅', name: 'Tomato' },
  { emoji: '🥚', name: 'Egg' },
  { emoji: '🥓', name: 'Bacon' },
  { emoji: '🫙', name: 'Sauce' },
  { emoji: '🧅', name: 'Onion' },
];

const BUN_EMOJI = '🍞';
const BOMB_EMOJI = '☣️';
const HEART_EMOJI = '❤️';

// ─── Utility ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

let ingredientCounter = 0;

function makeIngredient(level: number): Ingredient {
  const isBomb = Math.random() < Math.min(0.12 + level * 0.02, 0.3);
  const ing = isBomb ? null : GOOD_INGREDIENTS[Math.floor(Math.random() * GOOD_INGREDIENTS.length)];
  const speed = BASE_FALL_SPEED + (level - 1) * (BASE_FALL_SPEED * (SPEED_MULTIPLIER - 1));
  return {
    id: ++ingredientCounter,
    x: randomBetween(INGREDIENT_SIZE / 2 + 10, CANVAS_W - INGREDIENT_SIZE / 2 - 10),
    y: -INGREDIENT_SIZE,
    emoji: isBomb ? BOMB_EMOJI : ing!.emoji,
    name: isBomb ? 'Bad Meat' : ing!.name,
    isBomb,
    speed: speed + randomBetween(-0.3, 0.5),
    size: INGREDIENT_SIZE,
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed: randomBetween(-0.04, 0.04),
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function submitGameScore(orderId: number | null, score: number): Promise<{ pointsAwarded: number; message: string }> {
  const token = localStorage.getItem('bkb_access_token');
  if (!token) return { pointsAwarded: 0, message: 'Login to earn points!' };

  try {
    const res = await fetch('/api/game/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, score }),
    });
    const data = await res.json();
    return data.data ?? { pointsAwarded: 0, message: data.message };
  } catch {
    return { pointsAwarded: 0, message: 'Could not connect to server.' };
  }
}

// ─── RoundRect Polyfill (for older browsers) ──────────────────────────────────

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x: number, y: number, w: number, h: number, r: number | number[] = 0
  ) {
    const radius = typeof r === 'number' ? r : r[0] ?? 0;
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + w - radius, y);
    this.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.lineTo(x + w, y + h - radius);
    this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.lineTo(x + radius, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BurgerStackGameProps {
  orderId: number | null;
  orderStatus: string;
}

const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'PENDING', 'INCOMING_ORDER', 'ON_HOLD', 'ACCEPTED', 'ON_GRILL', 'GRILLING', 'ASSEMBLING'];

export const BurgerStackGame: React.FC<BurgerStackGameProps> = ({ orderId, orderStatus }) => {
  const { isAuthenticated } = useAuthStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>('IDLE');
  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES_MAX);
  const levelRef = useRef(1);
  const catchCountRef = useRef(0);
  const catcherXRef = useRef(CANVAS_W / 2 - CATCHER_W / 2);
  const ingredientsRef = useRef<Ingredient[]>([]);
  const stackRef = useRef<StackedLayer[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const rafRef = useRef<number>(0);
  const spawnTimerRef = useRef(0);
  const spawnIntervalRef = useRef(90);
  const comboRef = useRef(0);
  const claimedRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [finalScore, setFinalScore] = useState(0);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [pointsMsg, setPointsMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [displayLives, setDisplayLives] = useState(LIVES_MAX);
  const leftBtnRef = useRef(false);
  const rightBtnRef = useRef(false);

  // Draw font-supported emoji on canvas
  const drawEmoji = useCallback((ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number, size: number, rotation = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgColor = isDark ? '#1a1a2e' : '#fdf4e7';
    const textColor = isDark ? '#f0f0f0' : '#1a1a1a';
    const hudBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const catcherGrad = ctx.createLinearGradient(catcherXRef.current, CATCHER_Y, catcherXRef.current + CATCHER_W, CATCHER_Y + CATCHER_H);
    catcherGrad.addColorStop(0, '#ff6b00');
    catcherGrad.addColorStop(1, '#ff9a3c');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Dotted lane guides
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let x = 60; x < CANVAS_W; x += 90) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Ground line
    ctx.strokeStyle = isDark ? 'rgba(255,107,0,0.2)' : 'rgba(255,107,0,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, CATCHER_Y + CATCHER_H + 4);
    ctx.lineTo(CANVAS_W, CATCHER_Y + CATCHER_H + 4);
    ctx.stroke();

    // Falling ingredients
    for (const ing of ingredientsRef.current) {
      ctx.save();
      // Shadow glow
      ctx.shadowColor = ing.isBomb ? 'rgba(255,50,50,0.5)' : 'rgba(255,107,0,0.3)';
      ctx.shadowBlur = 10;
      drawEmoji(ctx, ing.emoji, ing.x, ing.y, ing.size, ing.rotation);
      ctx.shadowBlur = 0;
      ctx.restore();

      // Label beneath ingredient
      ctx.font = '9px Outfit, sans-serif';
      ctx.fillStyle = ing.isBomb ? '#ff4444' : (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)');
      ctx.textAlign = 'center';
      ctx.fillText(ing.name, ing.x, ing.y + ing.size / 2 + 9);
    }

    // Stacked burger layers (small previews above catcher)
    const maxStack = 8;
    const visibleStack = stackRef.current.slice(-maxStack);
    const stackStartY = CATCHER_Y - 10;
    for (let i = 0; i < visibleStack.length; i++) {
      const layer = visibleStack[i];
      const layerY = stackStartY - i * 22;
      if (layerY < 30) break;
      drawEmoji(ctx, layer.emoji, catcherXRef.current + CATCHER_W / 2, layerY, 22);
    }

    // Catcher bun
    ctx.save();
    ctx.shadowColor = 'rgba(255,107,0,0.5)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = catcherGrad;
    ctx.beginPath();
    ctx.roundRect(catcherXRef.current, CATCHER_Y, CATCHER_W, CATCHER_H, 8);
    ctx.fill();
    ctx.restore();
    // Bun emoji on catcher
    drawEmoji(ctx, BUN_EMOJI, catcherXRef.current + CATCHER_W / 2, CATCHER_Y + CATCHER_H / 2, 22);

    // HUD background strip
    ctx.fillStyle = hudBg;
    ctx.beginPath();
    ctx.roundRect(8, 8, CANVAS_W - 16, 46, 10);
    ctx.fill();

    // Score
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillStyle = '#ff6b00';
    ctx.textAlign = 'left';
    ctx.fillText(`⭐ ${scoreRef.current}`, 18, 36);

    // Level badge
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(`LVL ${levelRef.current}`, CANVAS_W / 2, 36);

    // Lives hearts
    ctx.textAlign = 'right';
    const hearts = HEART_EMOJI.repeat(livesRef.current) + '🖤'.repeat(LIVES_MAX - livesRef.current);
    ctx.font = '14px serif';
    ctx.fillText(hearts, CANVAS_W - 18, 36);

    // Combo flash
    if (comboRef.current >= 3) {
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillStyle = '#ff9a3c';
      ctx.textAlign = 'center';
      ctx.fillText(`🔥 x${comboRef.current} COMBO!`, CANVAS_W / 2, 68);
    }
  }, [drawEmoji]);

  const endGame = useCallback(async (score: number) => {
    cancelAnimationFrame(rafRef.current);
    stateRef.current = 'GAME_OVER';
    setGameState('GAME_OVER');
    setFinalScore(score);

    if (isAuthenticated && !claimedRef.current) {
      setSubmitting(true);
      claimedRef.current = true;
      const result = await submitGameScore(orderId, score);
      setPointsEarned(result.pointsAwarded);
      setPointsMsg(result.message);
      setSubmitting(false);
      if (result.pointsAwarded > 0) {
        toast.success(`+${result.pointsAwarded} Loyalty Points from Burger Stack! 🎮`, { duration: 5000 });
      }
    } else if (!isAuthenticated) {
      setPointsMsg('Login to earn loyalty points from playing!');
    }
  }, [isAuthenticated, orderId]);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = LIVES_MAX;
    levelRef.current = 1;
    catchCountRef.current = 0;
    catcherXRef.current = CANVAS_W / 2 - CATCHER_W / 2;
    ingredientsRef.current = [];
    stackRef.current = [];
    comboRef.current = 0;
    spawnTimerRef.current = 0;
    spawnIntervalRef.current = 90;
    stateRef.current = 'PLAYING';
    setGameState('PLAYING');
    setDisplayScore(0);
    setDisplayLevel(1);
    setDisplayLives(LIVES_MAX);
    setPointsEarned(null);
    setPointsMsg('');
    setFinalScore(0);

    const loop = (timestamp: number) => {
      if (stateRef.current !== 'PLAYING') return;

      // Move catcher
      if (keysRef.current['ArrowLeft'] || leftBtnRef.current) {
        catcherXRef.current = Math.max(0, catcherXRef.current - CATCHER_SPEED);
      }
      if (keysRef.current['ArrowRight'] || rightBtnRef.current) {
        catcherXRef.current = Math.min(CANVAS_W - CATCHER_W, catcherXRef.current + CATCHER_SPEED);
      }

      // Spawn ingredients
      spawnTimerRef.current++;
      const interval = Math.max(40, spawnIntervalRef.current - (levelRef.current - 1) * 6);
      if (spawnTimerRef.current >= interval) {
        ingredientsRef.current.push(makeIngredient(levelRef.current));
        spawnTimerRef.current = 0;
      }

      // Update ingredients
      const toRemove: number[] = [];
      for (let i = 0; i < ingredientsRef.current.length; i++) {
        const ing = ingredientsRef.current[i];
        ing.y += ing.speed;
        ing.rotation += ing.rotationSpeed;

        // Collision with catcher
        if (
          ing.y + ing.size / 2 >= CATCHER_Y &&
          ing.y - ing.size / 2 <= CATCHER_Y + CATCHER_H &&
          ing.x >= catcherXRef.current - 10 &&
          ing.x <= catcherXRef.current + CATCHER_W + 10
        ) {
          toRemove.push(i);
          if (ing.isBomb) {
            livesRef.current = Math.max(0, livesRef.current - 1);
            comboRef.current = 0;
            setDisplayLives(livesRef.current);
            if (livesRef.current <= 0) {
              endGame(scoreRef.current);
              return;
            }
          } else {
            // Caught good ingredient
            comboRef.current++;
            const comboBonus = comboRef.current >= 5 ? Math.floor(comboRef.current / 5) * 5 : 0;
            scoreRef.current += 10 + comboBonus;
            catchCountRef.current++;
            stackRef.current.push({ emoji: ing.emoji, name: ing.name });

            // Level up every N catches
            if (catchCountRef.current % LEVEL_UP_EVERY === 0) {
              levelRef.current++;
              scoreRef.current += 50; // level-up bonus
              setDisplayLevel(levelRef.current);
            }
            setDisplayScore(scoreRef.current);
          }
        }
        // Miss — fell past bottom
        else if (ing.y > CANVAS_H + 40) {
          toRemove.push(i);
          if (!ing.isBomb) {
            comboRef.current = 0;
            livesRef.current = Math.max(0, livesRef.current - 1);
            setDisplayLives(livesRef.current);
            if (livesRef.current <= 0) {
              endGame(scoreRef.current);
              return;
            }
          }
        }
      }

      // Remove caught/missed from back to front
      for (let i = toRemove.length - 1; i >= 0; i--) {
        ingredientsRef.current.splice(toRemove[i], 1);
      }

      drawFrame();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame, endGame]);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);

  // Draw idle frame once on mount
  useEffect(() => {
    if (gameState === 'IDLE') drawFrame();
  }, [gameState, drawFrame]);

  const loyaltyPoints = Math.min(Math.floor(finalScore / SCORE_PER_POINT), MAX_GAME_POINTS);
  const isActive = ACTIVE_STATUSES.includes(orderStatus);

  if (!isActive) return null;

  return (
    <div style={{
      marginTop: 32,
      background: 'var(--surface)',
      border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ff6b00 0%, #ff9a3c 100%)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: '1.6rem' }}>🎮</span>
        <div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1rem', color: '#fff', letterSpacing: 0.3 }}>
            Burger Stack Challenge
          </div>
          <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            Catch ingredients while you wait — earn loyalty points!
          </div>
        </div>
        {isAuthenticated && (
          <div style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: '0.72rem',
            color: '#fff',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            🏆 Up to {MAX_GAME_POINTS} pts
          </div>
        )}
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

        {/* Instructions strip */}
        {gameState === 'IDLE' && (
          <div style={{
            background: 'var(--cream-dark, rgba(255,107,0,0.06))',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            width: '100%',
            maxWidth: CANVAS_W,
          }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>How to play</strong>
            Use <kbd style={{ background: 'var(--border)', borderRadius: 4, padding: '0 5px', fontSize: '0.75rem' }}>←</kbd>{' '}
            <kbd style={{ background: 'var(--border)', borderRadius: 4, padding: '0 5px', fontSize: '0.75rem' }}>→</kbd> arrow keys (or tap buttons below) to move the bun.
            Catch 🥩🧀🥬 but dodge ☣️ Bad Meat!
            Miss an ingredient or catch a bomb = lose a life ❤️. 3 misses and it's game over.
          </div>
        )}

        {/* Canvas */}
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ display: 'block', maxWidth: '100%' }}
          />

          {/* IDLE overlay */}
          {gameState === 'IDLE' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              gap: 16,
            }}>
              <div style={{ fontSize: '4rem', lineHeight: 1 }}>🍔</div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.5rem', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                Burger Stack
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Ready to build the perfect burger?</div>
              <button
                onClick={startGame}
                id="burger-game-start-btn"
                style={{
                  background: 'linear-gradient(135deg, #ff6b00, #ff9a3c)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px 36px',
                  fontFamily: 'Outfit',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(255,107,0,0.5)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,107,0,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,107,0,0.5)'; }}
              >
                🎮 Play Now
              </button>
            </div>
          )}

          {/* GAME_OVER overlay */}
          {gameState === 'GAME_OVER' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              gap: 12,
              padding: 24,
            }}>
              <div style={{ fontSize: '3rem', lineHeight: 1 }}>😅</div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.4rem', color: '#fff' }}>Game Over!</div>

              {/* Score */}
              <div style={{
                background: 'rgba(255,107,0,0.15)',
                border: '1.5px solid rgba(255,107,0,0.4)',
                borderRadius: 12,
                padding: '12px 24px',
                textAlign: 'center',
                width: '100%',
                maxWidth: 260,
              }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>FINAL SCORE</div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.2rem', color: '#ff9a3c', lineHeight: 1.2 }}>
                  {finalScore}
                </div>
              </div>

              {/* Loyalty points result */}
              {submitting ? (
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Claiming your reward...
                </div>
              ) : pointsEarned !== null ? (
                <div style={{
                  background: pointsEarned > 0 ? 'rgba(72,199,142,0.15)' : 'rgba(255,255,255,0.08)',
                  border: `1.5px solid ${pointsEarned > 0 ? 'rgba(72,199,142,0.5)' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 10,
                  padding: '10px 20px',
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: 260,
                }}>
                  {pointsEarned > 0 ? (
                    <>
                      <div style={{ fontSize: '1.3rem' }}>🎉</div>
                      <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: '#48c78e' }}>
                        +{pointsEarned} Loyalty Points!
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                        Added to your account
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>{pointsMsg}</div>
                  )}
                </div>
              ) : !isAuthenticated ? (
                <div style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '10px 20px',
                  textAlign: 'center',
                  maxWidth: 260,
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
                    🔑 Login to earn up to <strong style={{ color: '#ff9a3c' }}>{MAX_GAME_POINTS} loyalty points</strong> per order!
                  </div>
                </div>
              ) : (
                loyaltyPoints > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 220 }}>
                    Would earn <strong style={{ color: '#ff9a3c' }}>+{loyaltyPoints} pts</strong> — already claimed for this order.
                  </div>
                )
              )}

              <button
                onClick={startGame}
                id="burger-game-restart-btn"
                style={{
                  background: 'linear-gradient(135deg, #ff6b00, #ff9a3c)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 32px',
                  fontFamily: 'Outfit',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(255,107,0,0.45)',
                  marginTop: 4,
                }}
              >
                🔄 Play Again
              </button>
            </div>
          )}
        </div>

        {/* On-screen controls */}
        {gameState === 'PLAYING' && (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {[
              { label: '◀ Left', dir: 'left' },
              { label: 'Right ▶', dir: 'right' },
            ].map(btn => (
              <button
                key={btn.dir}
                id={`burger-game-${btn.dir}-btn`}
                onPointerDown={() => { if (btn.dir === 'left') leftBtnRef.current = true; else rightBtnRef.current = true; }}
                onPointerUp={() => { if (btn.dir === 'left') leftBtnRef.current = false; else rightBtnRef.current = false; }}
                onPointerLeave={() => { if (btn.dir === 'left') leftBtnRef.current = false; else rightBtnRef.current = false; }}
                style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--border)',
                  borderRadius: 12,
                  padding: '14px 28px',
                  fontFamily: 'Outfit',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  touchAction: 'none',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background 0.1s, border-color 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Live HUD stats (outside canvas for accessibility) */}
        {gameState === 'PLAYING' && (
          <div style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Score', value: displayScore, color: '#ff6b00' },
              { label: 'Level', value: displayLevel, color: 'var(--text-primary)' },
              { label: 'Lives', value: HEART_EMOJI.repeat(displayLives), color: '#ff4444' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'var(--cream-dark, rgba(0,0,0,0.04))',
                borderRadius: 10,
                padding: '8px 18px',
                textAlign: 'center',
                minWidth: 80,
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: stat.color, marginTop: 2 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Footer tip */}
        {gameState !== 'PLAYING' && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
            {isAuthenticated
              ? `Score 100+ points to earn loyalty points (1 pt per 100 score, max ${MAX_GAME_POINTS} pts per order)`
              : 'Login to earn loyalty bonus points from the mini game!'}
          </p>
        )}
      </div>
    </div>
  );
};
