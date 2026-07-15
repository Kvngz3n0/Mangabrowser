const MangaScheduler = require('./cron');
const scheduler = new MangaScheduler();
scheduler.runUpdate().then(() => {
  console.log('Manual run complete');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
