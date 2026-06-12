import { defineConfig } from 'orval';

const orvalConfig = defineConfig({
  api: {
    input: {
      target: '../storage/app/scribe/openapi.yaml',
    },
    output: {
      target: './services/api.ts',
      client: 'axios',
      mode: 'tags-split',
      prettier: true,
    },
  },
});

export default orvalConfig;
