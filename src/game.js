import { CONFIG } from './config.js';
import { clamp, distance } from './physics.js';

export class Game {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;

    this.scoreEl = document.getElementById('score');
    this.comboEl = document.getElementById('combo');
    this.statusEl = document.getElementById('status');

    this.lastTime = 0;
    this.reset();
  }

  reset() {
    this.state = 'ready';
    this.score = 0;
    this.combo = 0;
    this.message = 'SPACE TO START';

    this.player = {
      x: CONFIG.player.startX,
      y: CONFIG.groundY,
      width: CONFIG.player.width,
      height: CONFIG.player.height,
      facing: 1,
      kickFlash: 0,
      lastFoot: null,
    };

    this.ball = {
      x: CONFIG.ball.startX,
      y: CONFIG.ball.startY,
      vx: 80,
      vy: -260,
      radius: CONFIG.ball.radius,
      spin: 0,
    };

    this.updateHud('Ready');
  }

  start() {
    this.state = 'playing';
    this.message = '';
    this.ball.x = this.player.x;
    this.ball.y = CONFIG.groundY - 145;
    this.ball.vx = 70;
    this.ball.vy = -260;
    this.updateHud('Playing');
  }

  update(deltaSeconds) {
    if (this.input.consumePress('Space')) {
      if (this.state !== 'playing') {
        this.start();
      }
    }

    if (this.state === 'playing') {
      this.updatePlayer(deltaSeconds);
      this.updateBall(deltaSeconds);
      this.handleKickInput();
      this.checkDrop();
    }

    if (this.player.kickFlash > 0) {
      this.player.kickFlash -= deltaSeconds;
    }
  }

  updatePlayer(deltaSeconds) {
    let move = 0;

    if (this.input.isDown('ArrowLeft')) {
      move -= 1;
      this.player.facing = -1;
    }

    if (this.input.isDown('ArrowRight')) {
      move += 1;
      this.player.facing = 1;
    }

    this.player.x += move * CONFIG.player.speed * deltaSeconds;
    this.player.x = clamp(this.player.x, 80, CONFIG.canvasWidth - 80);
  }

  updateBall(deltaSeconds) {
    const ball = this.ball;

    ball.vy += CONFIG.ball.gravity * deltaSeconds;
    ball.vy = Math.min(ball.vy, CONFIG.ball.maxFallSpeed);
    ball.x += ball.vx * deltaSeconds;
    ball.y += ball.vy * deltaSeconds;
    ball.vx *= CONFIG.ball.horizontalDamping;
    ball.spin += ball.vx * deltaSeconds * 0.04;

    if (ball.x < ball.radius) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx) * 0.72;
    }

    if (ball.x > CONFIG.canvasWidth - ball.radius) {
      ball.x = CONFIG.canvasWidth - ball.radius;
      ball.vx = -Math.abs(ball.vx) * 0.72;
    }
  }

  handleKickInput() {
    const leftFoot = this.input.consumePress('KeyA');
    const rightFoot = this.input.consumePress('KeyD');

    if (!leftFoot && !rightFoot) {
      return;
    }

    const foot = leftFoot ? 'left' : 'right';
    const ball = this.ball;
    const horizontalError = distance(ball.x, this.player.x);
    const inHeight = ball.y >= CONFIG.hit.footMinY && ball.y <= CONFIG.hit.footMaxY;
    const inRange = horizontalError <= CONFIG.hit.horizontalWindow;
    const descendingEnough = ball.vy > -180;

    this.player.kickFlash = 0.13;
    this.player.lastFoot = foot;

    if (inHeight && inRange && descendingEnough) {
      const perfect = horizontalError <= CONFIG.hit.perfectWindow && ball.y > 390;
      this.successfulFootKick(foot, perfect);
    } else {
      this.missedKick();
    }
  }

  successfulFootKick(foot, perfect) {
    const direction = foot === 'left' ? -1 : 1;
    const alternationBonus = this.player.lastFoot && this.player.lastFoot !== foot ? 1 : 0;
    const comboBonus = Math.floor(this.combo / CONFIG.scoring.comboEvery);
    const gained = CONFIG.scoring.foot + comboBonus + alternationBonus + (perfect ? CONFIG.scoring.perfectBonus : 0);

    this.score += gained;
    this.combo += 1;

    this.ball.vy = CONFIG.ball.kickVelocityY - Math.min(this.combo * 2.5, 90);
    this.ball.vx += direction * CONFIG.ball.kickVelocityX;
    this.ball.vx += (this.player.x - this.ball.x) * 2.4;
    this.ball.vx = clamp(this.ball.vx, -390, 390);
    this.ball.y = Math.min(this.ball.y, CONFIG.groundY - 40);

    this.updateHud(perfect ? `Perfect +${gained}` : `Kick +${gained}`);
  }

  missedKick() {
    this.combo = 0;
    this.ball.vy += 90;
    this.updateHud('Miss');
  }

  checkDrop() {
    if (this.ball.y + this.ball.radius >= CONFIG.groundY) {
      this.ball.y = CONFIG.groundY - this.ball.radius;
      this.state = 'gameover';
      this.message = `GAME OVER / SCORE ${this.score}`;
      this.updateHud('Dropped');
    }
  }

  updateHud(status) {
    this.scoreEl.textContent = String(this.score);
    this.comboEl.textContent = String(this.combo);
    this.statusEl.textContent = status;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    this.drawBackground(ctx);
    this.drawPlayer(ctx);
    this.drawBall(ctx);
    this.drawGuides(ctx);
    this.drawMessage(ctx);
  }

  drawBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.canvasHeight);
    gradient.addColorStop(0, '#2e2463');
    gradient.addColorStop(0.45, '#ef6a4a');
    gradient.addColorStop(0.7, '#ffc35c');
    gradient.addColorStop(0.71, '#24334a');
    gradient.addColorStop(1, '#101a2b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    ctx.fillStyle = '#ffe0a0';
    ctx.beginPath();
    ctx.arc(650, 165, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(12, 20, 38, 0.78)';
    for (let x = 0; x < CONFIG.canvasWidth; x += 58) {
      const h = 80 + ((x * 17) % 95);
      ctx.fillRect(x, 250 - h, 44, h);
    }

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.lineWidth = 2;
    for (let x = -CONFIG.canvasHeight; x < CONFIG.canvasWidth; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 210);
      ctx.lineTo(x + CONFIG.canvasHeight, 420);
      ctx.stroke();
    }
    for (let x = 0; x < CONFIG.canvasWidth + CONFIG.canvasHeight; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 210);
      ctx.lineTo(x - CONFIG.canvasHeight, 420);
      ctx.stroke();
    }

    ctx.fillStyle = '#162238';
    ctx.fillRect(0, CONFIG.groundY, CONFIG.canvasWidth, CONFIG.canvasHeight - CONFIG.groundY);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.groundY);
    ctx.lineTo(CONFIG.canvasWidth, CONFIG.groundY);
    ctx.stroke();
  }

  drawGuides(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '16px system-ui';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.hit.footMinY);
    ctx.lineTo(CONFIG.canvasWidth, CONFIG.hit.footMinY);
    ctx.stroke();
    ctx.fillText('FOOT ZONE', 24, CONFIG.hit.footMinY - 10);
    ctx.restore();
  }

  drawPlayer(ctx) {
    const p = this.player;
    const x = p.x;
    const ground = CONFIG.groundY;
    const flash = p.kickFlash > 0;

    ctx.save();
    ctx.translate(x, ground);

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(-20, -48, 40, 48);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-25, -102, 50, 54);
    ctx.fillStyle = '#d18a52';
    ctx.fillRect(-18, -140, 36, 36);
    ctx.fillStyle = '#3b2417';
    ctx.fillRect(-22, -150, 44, 18);

    ctx.fillStyle = flash ? '#ffc35c' : '#ef4444';
    ctx.fillRect(-36, -8, 32, 12);
    ctx.fillRect(4, -8, 32, 12);

    if (flash) {
      ctx.strokeStyle = '#ffc35c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.lastFoot === 'left' ? -38 : 38, -20, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawBall(ctx) {
    const b = this.ball;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.spin);

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0b1220';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#0b1220';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-3, -b.radius + 5, 6, 10);
    ctx.fillRect(-3, b.radius - 15, 6, 10);
    ctx.fillRect(-b.radius + 5, -3, 10, 6);
    ctx.fillRect(b.radius - 15, -3, 10, 6);

    ctx.restore();
  }

  drawMessage(ctx) {
    if (!this.message) {
      return;
    }

    ctx.save();
    ctx.fillStyle = 'rgba(8, 13, 24, 0.62)';
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.font = '700 42px system-ui';
    ctx.fillText(this.message, CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2);
    ctx.font = '700 22px system-ui';
    ctx.fillText('A / D to kick, Arrow keys to move', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 48);
    ctx.restore();
  }

  frame(time) {
    if (!this.lastTime) {
      this.lastTime = time;
    }

    const deltaSeconds = Math.min((time - this.lastTime) / 1000, 0.033);
    this.lastTime = time;

    this.update(deltaSeconds);
    this.draw();
    this.input.endFrame();
  }
}
