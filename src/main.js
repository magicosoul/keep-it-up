import '../styles/style.css';
import { InputManager } from './input.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
const input = new InputManager();
const game = new Game(canvas, input);

function loop(time) {
  game.frame(time);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
