"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bot_1 = require("./bot");
const scraper_1 = require("./scraper");
const webhook_1 = require("./webhook");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Set up webhook routes
(0, webhook_1.setupWebhook)(app);
// Simple health check
app.get('/', (req, res) => {
    res.send('Trading Bot is running...');
});
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
console.log('Botni ishga tushirishga harakat qilyapman...');
// Telegram Botni ishga tushiramiz
bot_1.bot.launch().then(() => {
    console.log('🤖 Telegram Bot muvaffaqiyatli ishga tushdi.');
    console.log('Skreperni ishga tushirishga harakat qilyapman...');
    // Bot yurgandan so'ng, orqa fondagi Skreper (haker kabi) poylovchi tizimni qo'shamiz
    (0, scraper_1.startScraper)();
}).catch((err) => {
    console.error('Telegram bot ishga tushishda xatolik:', err);
});
// Windows/Linux da dasturni to'g'ri to'xtatish uchun
process.once('SIGINT', () => bot_1.bot.stop('SIGINT'));
process.once('SIGTERM', () => bot_1.bot.stop('SIGTERM'));
