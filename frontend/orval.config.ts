import { defineConfig } from 'orval';

const orvalConfig = defineConfig({
  api: {
    input: {
      target: '../backend/storage/app/scribe/openapi.yaml',
    },
    output: {
      target: './src/services/api.ts',
      client: 'axios',
      mode: 'tags-split',
      prettier: true,
    },
  },
});

export default orvalConfig;
