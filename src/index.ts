import 'dotenv/config';
import { bot } from './bot';
import { startScraper } from './scraper';

console.log('Botni ishga tushirishga harakat qilyapman...');

// Telegram Botni ishga tushiramiz
bot.launch().then(() => {
  console.log('🤖 Telegram Bot muvaffaqiyatli ishga tushdi.');
  
  console.log('Skreperni ishga tushirishga harakat qilyapman...');
  // Bot yurgandan so'ng, orqa fondagi Skreper (haker kabi) poylovchi tizimni qo'shamiz
  startScraper();
  
}).catch((err) => {
  console.error('Telegram bot ishga tushishda xatolik:', err);
});

// Windows/Linux da dasturni to'g'ri to'xtatish uchun
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
