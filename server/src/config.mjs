// config.mjs
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .env can live in server/ or in the repo root, wherever the server is started from
config({ path: path.join(__dirname, '../.env') });
config({ path: path.join(__dirname, '../../.env') });
