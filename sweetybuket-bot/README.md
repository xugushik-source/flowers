# Sweety Buket Telegram Bot

Sales assistant for @Sweety_Buket_Bot.

## Environment
- TELEGRAM_BOT_TOKEN — BotFather token (never commit it)
- ADMIN_CHAT_ID — optional Telegram chat id that receives completed leads/orders

## Run
Node 20+:

npm start

The MVP uses Telegram long polling and stores active conversations in memory. Website deep links can use:
https://t.me/Sweety_Buket_Bot?start=PRODUCT_ID
