import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages のようなサブディレクトリ配信でも動くように相対パスで出す
  base: './',
  build: {
    // 既定のままだと iOS 16.4 (2023年3月) 未満で動かない。
    // 使っているランタイムAPIは Object.fromEntries と flatMap (どちらもES2019) までなので、
    // もっと古いブラウザまで対象にできる。iOS 14 は2020年9月。
    target: ['es2020', 'chrome87', 'edge88', 'firefox78', 'safari14'],
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        juggling: fileURLToPath(new URL('./juggling/index.html', import.meta.url)),
        team: fileURLToPath(new URL('./team/index.html', import.meta.url)),
      },
    },
  },
});
