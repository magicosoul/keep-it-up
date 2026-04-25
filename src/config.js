export const CONFIG = {
  canvasWidth: 960,
  canvasHeight: 540,
  groundY: 455,
  player: {
    width: 52,
    height: 112,
    speed: 440,
    startX: 480,
  },
  ball: {
    radius: 18,
    startX: 480,
    startY: 240,
    gravity: 1500,
    maxFallSpeed: 980,
    kickVelocityY: -760,
    kickVelocityX: 95,
    horizontalDamping: 0.992,
  },
  hit: {
    footMinY: 350,
    footMaxY: 455,
    horizontalWindow: 72,
    perfectWindow: 26,
  },
  scoring: {
    foot: 1,
    perfectBonus: 2,
    comboEvery: 10,
  },
  modes: {
    attack90: {
      label: '90s Attack',
      durationSeconds: 90,
    },
    attack120: {
      label: '120s Attack',
      durationSeconds: 120,
    },
    hardcore: {
      label: 'Hardcore',
      durationSeconds: null,
    },
  },
};
