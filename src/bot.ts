import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { db } from './db';

const BOT_TOKEN = process.env.BOT_TOKEN || '';

if (!BOT_TOKEN) {
  console.warn('BOT_TOKEN is not defined in environment variables.');
}

export const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  const chatId = ctx.from.id;
  const added = db.addSubscriber(chatId);
  if (added) {
    ctx.reply(
      `Assalomu alaykum! Muvaffaqiyatli obuna bo'ldingiz.\n\nMen TradingView indikatoridan kelgan signallarni sizga yuborib turaman.\nIltimos, signallarni kuting.`
    );
  } else {
    ctx.reply("Siz allaqachon obuna bo'lgansiz. Yangi signallarni kuting.");
  }
});

bot.command('stop', (ctx) => {
  const chatId = ctx.from.id;
  db.removeSubscriber(chatId);
  ctx.reply('Obunani bekor qildingiz. Endi signallar qabul qilmaysiz.');
});

bot.catch((err, ctx) => {
  console.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
});
