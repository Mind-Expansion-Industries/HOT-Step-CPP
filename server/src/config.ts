// config.ts — Environment-based configuration for HOT-Step CPP server
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (two levels up from server/src/)
dotenvConfig({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // ace-server-hs configuration
  aceServer: {
    exe: process.env.ACESTEPCPP_EXE || '',
    models: process.env.ACESTEPCPP_MODELS || '',
    adapters: process.env.ACESTEPCPP_ADAPTERS || '',
    port: parseInt(process.env.ACESTEPCPP_PORT || '8085', 10),
    host: process.env.ACESTEPCPP_HOST || '127.0.0.1',
    get url() {
      return `http://${this.host}:${this.port}`;
    },
  },

  // Node.js server
  server: {
    port: parseInt(process.env.SERVER_PORT || '3001', 10),
    host: process.env.SERVER_HOST || '0.0.0.0',
  },

  // Data paths
  data: {
    dir: path.resolve(__dirname, '..', process.env.DATA_DIR || './data'),
    get dbPath() {
      return path.join(this.dir, 'hotstep.db');
    },
    get audioDir() {
      return path.join(this.dir, 'audio');
    },
  },
};
