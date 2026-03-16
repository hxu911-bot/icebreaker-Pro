import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.controller';
import { settingsRouter } from './modules/settings/settings.controller';
import { profilesRouter } from './modules/profiles/profiles.controller';
import { parseRouter } from './modules/parse/parse.controller';
import { csvRouter } from './modules/parse/csv.controller';
import { campaignsRouter } from './modules/campaigns/campaigns.controller';
import { generateRouter } from './modules/generate/generate.controller';
import { sendRouter } from './modules/send/send.controller';

const app = express();
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', version: 'demo-v2' }));
app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/parse', parseRouter);
app.use('/api/parse-csv', csvRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/send', sendRouter);
app.use(errorHandler);

export default app;
