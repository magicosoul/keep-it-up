export class InputManager {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();

    window.addEventListener('keydown', (event) => {
      if (this.isGameKey(event.code)) {
        event.preventDefault();
      }

      if (!this.keys.has(event.code)) {
        this.justPressed.add(event.code);
      }

      this.keys.add(event.code);
    });

    window.addEventListener('keyup', (event) => {
      if (this.isGameKey(event.code)) {
        event.preventDefault();
      }

      this.keys.delete(event.code);
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  consumePress(code) {
    if (!this.justPressed.has(code)) {
      return false;
    }

    this.justPressed.delete(code);
    return true;
  }

  endFrame() {
    this.justPressed.clear();
  }

  isGameKey(code) {
    return [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'KeyA',
      'KeyD',
      'KeyW',
      'KeyS',
      'Space',
    ].includes(code);
  }
}
