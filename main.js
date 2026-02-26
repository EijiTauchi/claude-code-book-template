const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('scoreDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const messageEl = document.getElementById('message');
const startBtn = document.getElementById('startBtn');

// --- 定数 ---
const PADDLE_HEIGHT = 12;
const PADDLE_WIDTH = 80;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 52;
const BRICK_HEIGHT = 18;
const BRICK_PADDING = 6;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 20;

const BRICK_COLORS = [
  '#f72585',
  '#b5179e',
  '#7209b7',
  '#3a86ff',
  '#4cc9f0',
];

// --- ゲーム状態 ---
let score = 0;
let lives = 3;
let level = 1;
let gameRunning = false;
let animationId = null;

// --- パドル ---
let paddle = {
  x: canvas.width / 2 - PADDLE_WIDTH / 2,
  y: canvas.height - 30,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: 6,
};

// --- ボール ---
let ball = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  dx: 0,
  dy: 0,
  radius: BALL_RADIUS,
  launched: false,
};

// --- ブロック ---
let bricks = [];

function createBricks() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    bricks[r] = [];
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks[r][c] = { alive: true, color: BRICK_COLORS[r % BRICK_COLORS.length] };
    }
  }
}

// --- キー入力 ---
const keys = { ArrowLeft: false, ArrowRight: false };

document.addEventListener('keydown', (e) => {
  if (e.key in keys) keys[e.key] = true;
  if (e.key === ' ' && gameRunning && !ball.launched) launchBall();
});

document.addEventListener('keyup', (e) => {
  if (e.key in keys) keys[e.key] = false;
});

// --- マウス操作 ---
canvas.addEventListener('mousemove', (e) => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = mouseX - paddle.width / 2;
  clampPaddle();
});

canvas.addEventListener('click', () => {
  if (gameRunning && !ball.launched) launchBall();
});

// --- ボール発射 ---
function launchBall() {
  const speed = 3.5 + (level - 1) * 0.5;
  const angle = -Math.PI / 4 - Math.random() * Math.PI / 2;
  ball.dx = speed * Math.cos(angle);
  ball.dy = speed * Math.sin(angle);
  ball.launched = true;
}

// --- パドルを画面内に収める ---
function clampPaddle() {
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

// --- 初期化 ---
function resetBall() {
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - BALL_RADIUS - 2;
  ball.dx = 0;
  ball.dy = 0;
  ball.launched = false;
}

function initGame() {
  score = 0;
  lives = 3;
  level = 1;
  paddle.x = canvas.width / 2 - PADDLE_WIDTH / 2;
  paddle.width = PADDLE_WIDTH;
  createBricks();
  resetBall();
  updateUI();
}

function updateUI() {
  scoreDisplay.textContent = score;
  livesDisplay.textContent = lives;
  levelDisplay.textContent = level;
}

// --- 衝突判定 ---
function checkBrickCollision() {
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const b = bricks[r][c];
      if (!b.alive) continue;

      const bx = BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING);
      const by = BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING);

      // ボールの中心がブロックに最も近い点を求める
      const nearX = Math.max(bx, Math.min(ball.x, bx + BRICK_WIDTH));
      const nearY = Math.max(by, Math.min(ball.y, by + BRICK_HEIGHT));
      const distX = ball.x - nearX;
      const distY = ball.y - nearY;

      if (distX * distX + distY * distY <= BALL_RADIUS * BALL_RADIUS) {
        b.alive = false;
        score += 10 * level;
        updateUI();

        // 反射方向を決定
        const overlapX = Math.abs(distX);
        const overlapY = Math.abs(distY);
        if (overlapX < overlapY) {
          ball.dx *= -1;
        } else {
          ball.dy *= -1;
        }

        spawnParticles(bx + BRICK_WIDTH / 2, by + BRICK_HEIGHT / 2, b.color);
      }
    }
  }
}

function checkPaddleCollision() {
  if (
    ball.y + BALL_RADIUS >= paddle.y &&
    ball.y - BALL_RADIUS <= paddle.y + PADDLE_HEIGHT &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width &&
    ball.dy > 0
  ) {
    // パドルの当たった位置によって反射角を変える
    const hitPos = (ball.x - paddle.x) / paddle.width; // 0〜1
    const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63°〜63°
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx = speed * Math.sin(angle);
    ball.dy = -speed * Math.cos(angle);
    ball.y = paddle.y - BALL_RADIUS - 1;
  }
}

function allBricksCleared() {
  return bricks.every(row => row.every(b => !b.alive));
}

// --- パーティクル ---
let particles = [];

function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x, y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 3,
      color,
      life: 1.0,
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.1;
    p.life -= 0.04;
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// --- 描画 ---
function drawBackground() {
  ctx.fillStyle = '#0f0f23';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 薄いグリッド線
  ctx.strokeStyle = 'rgba(58, 134, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

function drawBricks() {
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      if (!bricks[r][c].alive) continue;
      const x = BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING);
      const y = BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING);
      const color = bricks[r][c].color;

      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 3, y + 3, BRICK_WIDTH, BRICK_HEIGHT);

      // ブロック本体
      ctx.fillStyle = color;
      ctx.fillRect(x, y, BRICK_WIDTH, BRICK_HEIGHT);

      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x, y, BRICK_WIDTH, 4);
    }
  }
}

function drawPaddle() {
  const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
  grad.addColorStop(0, '#4cc9f0');
  grad.addColorStop(1, '#3a86ff');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
  ctx.fill();

  // グロー
  ctx.shadowColor = '#4cc9f0';
  ctx.shadowBlur = 16;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawBall() {
  const grad = ctx.createRadialGradient(
    ball.x - 2, ball.y - 2, 1,
    ball.x, ball.y, BALL_RADIUS
  );
  grad.addColorStop(0, '#fff');
  grad.addColorStop(1, '#f72585');

  ctx.shadowColor = '#f72585';
  ctx.shadowBlur = 18;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 発射待ちの点滅ヒント
  if (!ball.launched && gameRunning) {
    ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(Date.now() / 300)})`;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('クリック / スペースで発射', canvas.width / 2, canvas.height - 10);
  }
}

// --- メインループ ---
function update() {
  // パドル移動
  if (keys.ArrowLeft) { paddle.x -= paddle.speed; clampPaddle(); }
  if (keys.ArrowRight) { paddle.x += paddle.speed; clampPaddle(); }

  if (ball.launched) {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 壁反射
    if (ball.x - BALL_RADIUS < 0) { ball.x = BALL_RADIUS; ball.dx = Math.abs(ball.dx); }
    if (ball.x + BALL_RADIUS > canvas.width) { ball.x = canvas.width - BALL_RADIUS; ball.dx = -Math.abs(ball.dx); }
    if (ball.y - BALL_RADIUS < 0) { ball.y = BALL_RADIUS; ball.dy = Math.abs(ball.dy); }

    checkBrickCollision();
    checkPaddleCollision();

    // ボール落下
    if (ball.y - BALL_RADIUS > canvas.height) {
      lives--;
      updateUI();
      if (lives <= 0) {
        endGame(false);
        return;
      }
      resetBall();
    }

    // 全ブロック消去
    if (allBricksCleared()) {
      level++;
      updateUI();
      createBricks();
      resetBall();
      messageEl.textContent = `レベル ${level} スタート！`;
      setTimeout(() => { messageEl.textContent = ''; }, 1500);
    }
  } else {
    // 発射前はパドルに追従
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - BALL_RADIUS - 2;
  }

  updateParticles();
}

function draw() {
  drawBackground();
  drawBricks();
  drawParticles();
  drawPaddle();
  drawBall();
}

function gameLoop() {
  update();
  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  initGame();
  gameRunning = true;
  messageEl.textContent = '';
  startBtn.textContent = 'リスタート';
  if (animationId) cancelAnimationFrame(animationId);
  gameLoop();
}

function endGame(won) {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  messageEl.textContent = won ? 'クリア！' : 'ゲームオーバー';
  startBtn.textContent = 'もう一度';
}

startBtn.addEventListener('click', startGame);

// 初期描画
drawBackground();
ctx.fillStyle = 'rgba(255,255,255,0.5)';
ctx.font = '20px Arial';
ctx.textAlign = 'center';
ctx.fillText('スタートボタンを押してください', canvas.width / 2, canvas.height / 2);
