import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages のようなサブディレクトリ配信でも動くように相対パスで出す
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        juggling: fileURLToPath(new URL('./juggling/index.html', import.meta.url)),
        team: fileURLToPath(new URL('./team/index.html', import.meta.url)),
      },
    },
  },
});
