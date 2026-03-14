"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
require("dotenv/config");
const telegraf_1 = require("telegraf");
const db_1 = require("./db");
const BOT_TOKEN = process.env.BOT_TOKEN || '';
if (!BOT_TOKEN) {
    console.warn('BOT_TOKEN is not defined in environment variables.');
}
exports.bot = new telegraf_1.Telegraf(BOT_TOKEN);
exports.bot.start((ctx) => {
    const chatId = ctx.from.id;
    const added = db_1.db.addSubscriber(chatId);
    if (added) {
        ctx.reply(`Assalomu alaykum! Muvaffaqiyatli obuna bo'ldingiz.\n\nMen TradingView indikatoridan kelgan signallarni sizga yuborib turaman.\nIltimos, signallarni kuting.`);
    }
    else {
        ctx.reply("Siz allaqachon obuna bo'lgansiz. Yangi signallarni kuting.");
    }
});
exports.bot.command('stop', (ctx) => {
    const chatId = ctx.from.id;
    db_1.db.removeSubscriber(chatId);
    ctx.reply('Obunani bekor qildingiz. Endi signallar qabul qilmaysiz.');
});
exports.bot.catch((err, ctx) => {
    console.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
});
