// models.ts — Model listing route
//
// Proxies /props from ace-server and returns available models + adapters.

import { Router } from 'express';
import { aceClient } from '../services/aceClient.js';

const router = Router();

// GET /api/models — list available models from ace-server
router.get('/', async (_req, res) => {
  try {
    const props = await aceClient.props();
    res.json({
      models: props.models,
      adapters: props.adapters,
      config: props.cli,
      defaults: props.default,
    });
  } catch (err: any) {
    res.status(502).json({
      error: 'Failed to fetch models from ace-server',
      details: err.message,
    });
  }
});

// GET /api/models/health — check ace-server connectivity
router.get('/health', async (_req, res) => {
  const reachable = await aceClient.isReachable();
  res.json({
    aceServer: reachable ? 'connected' : 'disconnected',
  });
});

export default router;
