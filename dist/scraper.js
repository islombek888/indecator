"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScraper = startScraper;
require("dotenv/config");
const puppeteer_1 = __importDefault(require("puppeteer"));
const bot_1 = require("./bot");
const db_1 = require("./db");
const SESSION_ID = process.env.TRADINGVIEW_SESSIONID || '';
const CHART_URL = process.env.CHART_URL || '';
async function startScraper() {
    if (!SESSION_ID || !CHART_URL) {
        console.warn('DIQQAT: TRADINGVIEW_SESSIONID yoki CHART_URL .env faylida kiritilmagan.');
        console.warn('Bot telegram signallari uchun ishlayveradi, lekin TradingView ga ulanmadi.');
        return;
    }
    try {
        const browser = await puppeteer_1.default.launch({
            headless: true, // Haqiqiy yashirin Chrome
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        // Kukini o'rnatamiz (Sizning akkauntingizga kirish uchun)
        await page.setCookie({
            name: 'sessionid',
            value: SESSION_ID,
            domain: '.tradingview.com'
        });
        console.log('TradingView sahifasiga ulanmoqda...');
        // Sizning shaxsiy chart silkangizga kiradi
        await page.goto(CHART_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('Chart ochildi. Endi 24/7 signallarni poylaymiz...');
        // Asosiy Node.js ga browser orqali signal ma'lumotlarini yetkazuvchi ko'prik
        await page.exposeFunction('onSignalFound', async (signalText) => {
            console.log("🎉 Signal aniqlandi:", signalText);
            // Timeframe filtri (Faqat 1M va 1H)
            // Signal matnida '1M', '1m', '1H', '1h', '1 minut', '1 soat' borligini tekshiramiz
            const is1M = /\b(1[Mm]|1\s*minut|1\s*minute)\b/i.test(signalText);
            const is1H = /\b(1[Hh]|1\s*soat|1\s*hour)\b/i.test(signalText);
            if (!is1M && !is1H) {
                console.log("⏭️ Boshqa timeframe (filtrlangan):", signalText);
                return;
            }
            // Rasmga olamiz
            const imageBuffer = await page.screenshot({ type: 'png' });
            // Xabarni analiz qilamiz
            const isBuy = /\bBUY\b/i.test(signalText);
            const isSell = /\bSELL\b/i.test(signalText);
            const actionEmoji = isBuy ? '🟢' : (isSell ? '🔴' : '🟡');
            const actionText = isBuy ? 'BUY' : (isSell ? 'SELL' : 'SIGNAL');
            // Stop Loss (SL) ni matndan qidirib topish (SL: 1234.56)
            const slMatch = signalText.match(/SL:?\s*([\d.]+)/i);
            const slValue = slMatch ? slMatch[1] : 'Indikatorda ko\'rsatilgan';
            // Timeframe nomi
            const tfName = is1M ? '1 MINUT (1M)' : '1 SOAT (1H)';
            const message = `
${actionEmoji} <b>${actionText} SIGNAL</b>
==============
⏳ <b>Timeframe:</b> ${tfName}
🛑 <b>Stop Loss:</b> ${slValue}
==============
${signalText.replace(/\[BOT_SIGNAL\]/i, '').trim()}
==============
<i>TradingView Skreper Tizimi</i>
      `;
            // Hamma obunachilarga yuboramiz
            const subscribers = db_1.db.getSubscribers();
            for (const chatId of subscribers) {
                try {
                    await bot_1.bot.telegram.sendPhoto(chatId, { source: Buffer.from(imageBuffer) }, {
                        caption: message,
                        parse_mode: 'HTML'
                    });
                }
                catch (err) {
                    console.error(`Telegramga jo'natishda xatolik: ${chatId}`, err);
                }
            }
        });
        // Har bir soniyada ekranda "[BOT_SIGNAL]" degan so'zni qidiramiz
        await page.evaluate(() => {
            setInterval(() => {
                const dialogs = document.querySelectorAll('div');
                for (let i = 0; i < dialogs.length; i++) {
                    const dialog = dialogs[i];
                    if (dialog.innerText && dialog.innerText.includes('[BOT_SIGNAL]')) {
                        const isPopup = dialog.getAttribute('data-dialog-name') === 'Alert' ||
                            dialog.className.includes('dialog') ||
                            dialog.className.includes('popup');
                        if (isPopup) {
                            const text = dialog.innerText.trim();
                            // @ts-ignore
                            window.onSignalFound(text);
                            const closeBtn = dialog.querySelector('button, [data-name="close"], .close-button');
                            if (closeBtn) {
                                closeBtn.click();
                            }
                            else {
                                dialog.remove();
                            }
                            break;
                        }
                    }
                }
            }, 1000);
        });
    }
    catch (error) {
        console.error("Puppeteer xatolikka uchradi:", error);
    }
}
