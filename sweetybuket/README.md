# Sweety Buket

Сайт по образцу La Fleur (тот же код, своя палитра). Фото и видео из Instagram @sweetybuket.

- Данные: `assets/js/data.js` (товары, категории, контакты). У каждого товара `source` — ссылка на пост.
- Цены пока неизвестны: `price: null` → «Цена по запросу». Впишите число, и цена появится в карточке, корзине и сообщении WhatsApp.
- Фото: исходник в `src/<id>.jpg` → `python3 scripts/process_sweety.py <id>` (нужны Pillow и `rembg[cpu]`).
- Видео: `assets/video/reelN.mp4` + обложка `reelN.jpg/webp`; список — `REELS` в `data.js`. Заставка — `reel2`.
- Заказ: WhatsApp +7 916 589-66-00; в меню и подвале также Telegram, второй номер и Instagram.
