import { defineConfig } from 'orval';

const orvalConfig = defineConfig({
  api: {
    input: {
      target: 'http://localhost:8000/api/docs/openapi.json',
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
