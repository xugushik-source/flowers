# SweetyBuket

Сайт на общем каркасе с La Fleur, свой слой бренда в `assets/css/sweety.css`. Фото и видео из Instagram @sweetybuket.

- Данные: `assets/js/data.js` (товары, категории, поводы, хиты `FEATURED`, видео `REELS`, контакты). У каждого товара `source` — ссылка на пост.
- Цены пока неизвестны: `price: null` → «Цена по запросу». Впишите число — цена появится в карточке, корзине и сообщении WhatsApp.
- Фото: оригиналы в `originals/` (без изменений), кроп и форматы — `python3 scripts/sweety_assets.py [имя]` (Pillow с AVIF). Кроп и фокус для каждого фото задаются в скрипте; список размеров попадает в `assets/js/images.js`.
- Новый товар: положить фото в `originals/<id>.jpg`, запустить скрипт, добавить строку в `PRODUCTS`.
- Разбор фото: `PHOTO-AUDIT.md`, недостающие кадры: `IMAGE-GAPS.md`.
- Заказ: WhatsApp +7 916 589-66-00; в меню и подвале также Telegram, второй номер и Instagram.
