import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// 共有用に1ファイルへ固めるためのビルド。
// modulePreload を切って、エントリが他のチャンクを import しないようにする。
export default defineConfig({
  build: {
    outDir: 'dist-artifact-raw',
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./team/index.html', import.meta.url)),
    },
  },
});
