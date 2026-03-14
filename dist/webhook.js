"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebhook = setupWebhook;
const bot_1 = require("./bot");
const db_1 = require("./db");
const chart_1 = require("./chart");
// Expected JSON format from TradingView:
// {
//   "symbol": "XAUUSD",
//   "action": "BUY",
//   "entry": "2050.50",
//   "sl": "2040.00",
//   "tp": "2080.00",
//   "interval": "15"
// }
function setupWebhook(app) {
    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            console.log('Received signal:', data);
            // Validate required fields
            if (!data.symbol || !data.action || !data.entry) {
                return res.status(400).send('Invalid signal payload');
            }
            res.status(200).send('OK'); // acknowledge quickly to TradingView
            const symbol = data.symbol;
            const action = data.action.toUpperCase();
            const entry = data.entry;
            const sl = data.sl || 'N/A';
            const tp = data.tp || 'N/A';
            const interval = data.interval || '15';
            // Determine colors and emojis
            const isBuy = action === 'BUY' || action === 'LONG';
            const emoji = isBuy ? '🟢' : '🔴';
            const actionText = isBuy ? 'Xarid (BUY)' : 'Sotish (SELL)';
            const message = `
${emoji} <b>YANGI SIGNAL: ${symbol}</b>
==============
📉 <b>Yo'nalish:</b> ${actionText}
🎯 <b>Kirish narxi (Entry):</b> ${entry}
🛑 <b>Stop Loss (SL):</b> ${sl}
💵 <b>Take Profit (TP):</b> ${tp}
⏳ <b>Timeframe:</b> ${interval}m
==============
<i>TradingView Indikatoridan kelgan signal. Omad!</i>
      `;
            // Generate screenshot
            const imageBuffer = await (0, chart_1.generateChartScreenshot)(symbol, interval);
            // Broadcast to all subscribers
            const subscribers = db_1.db.getSubscribers();
            for (const chatId of subscribers) {
                try {
                    if (imageBuffer) {
                        await bot_1.bot.telegram.sendPhoto(chatId, { source: imageBuffer }, {
                            caption: message,
                            parse_mode: 'HTML'
                        });
                    }
                    else {
                        // fallback to text if screenshot failed
                        await bot_1.bot.telegram.sendMessage(chatId, message, {
                            parse_mode: 'HTML'
                        });
                    }
                }
                catch (botErr) {
                    console.error(`Failed to send to ${chatId}:`, botErr);
                    // If bot blocks or user deletes chat, maybe remove subscriber?
                }
            }
        }
        catch (err) {
            console.error('Error handling webhook', err);
            // Wait, express wants us to respond if we haven't already
            if (!res.headersSent) {
                res.status(500).send('Server Error');
            }
        }
    });
}
