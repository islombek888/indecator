import { Application, Request, Response } from 'express';
import { bot } from './bot';
import { db } from './db';
import { generateChartScreenshot } from './chart';

// Expected JSON format from TradingView:
// {
//   "symbol": "XAUUSD",
//   "action": "BUY",
//   "entry": "2050.50",
//   "sl": "2040.00",
//   "tp": "2080.00",
//   "interval": "15"
// }

export function setupWebhook(app: Application) {
  app.post('/webhook', async (req: Request, res: Response) => {
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
      const imageBuffer = await generateChartScreenshot(symbol, interval);

      // Broadcast to all subscribers
      const subscribers = db.getSubscribers();
      
      for (const chatId of subscribers) {
        try {
          if (imageBuffer) {
            await bot.telegram.sendPhoto(chatId, { source: imageBuffer }, {
              caption: message,
              parse_mode: 'HTML'
            });
          } else {
            // fallback to text if screenshot failed
            await bot.telegram.sendMessage(chatId, message, {
              parse_mode: 'HTML'
            });
          }
        } catch (botErr) {
          console.error(`Failed to send to ${chatId}:`, botErr);
          // If bot blocks or user deletes chat, maybe remove subscriber?
        }
      }

    } catch (err) {
      console.error('Error handling webhook', err);
      // Wait, express wants us to respond if we haven't already
      if (!res.headersSent) {
        res.status(500).send('Server Error');
      }
    }
  });
}
