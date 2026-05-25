import 'dotenv/config';
import app from './app';
import { connectDB } from './config/db';

const PORT = parseInt(process.env.PORT ?? '5000', 10);

async function bootstrap() {
  await connectDB();

  app.listen(PORT, () => {
    const ghReady = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    console.log(`\n🚀 LifeOS API running`);
    console.log(`   ├─ Port     : ${PORT}`);
    console.log(`   ├─ Env      : ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`   ├─ GitHub   : ${ghReady ? 'configured' : 'NOT configured (set GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET)'}`);
    console.log(`   └─ Docs     : http://localhost:${PORT}/api/health\n`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});