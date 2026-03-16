import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

async function main() {
  await prisma.$connect();
  app.listen(env.PORT, () => {
    console.log(`Icebreaker Demo backend running on http://localhost:${env.PORT}`);
  });
}

main().catch(console.error);
