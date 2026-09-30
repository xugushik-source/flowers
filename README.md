# La Fleur

Статический сайт цветочного бутика (GitHub Pages). Заказ оформляется через WhatsApp.

## Структура

```
index.html               разметка страницы
assets/css/site.css      дизайн-система, вёрстка, анимации
assets/js/data.js        ВСЕ данные: товары, цены, наборы, дополнения, поводы, тексты интерфейса
assets/js/app.js         логика: splash, фильтры, карточка товара, корзина, оформление, WhatsApp
assets/products/         фото товаров (4:5, .jpg + .webp)
assets/products/src/     исходники фото товаров
assets/hero/             splash и editorial-фото
assets/occasions/        фото плиток «Для какого момента?»
incoming/                исходные фото, загруженные владельцем
scripts/process_images.py  обработка фото
docs/TZ.md               техническое задание
```

## Как поменять товар, цену или фото

- Цена, название, описание, повод: правится в `assets/js/data.js`, массив `PRODUCTS`.
- Фото: положите файл в `assets/products/src/<id>.jpg`, затем выполните `python3 scripts/process_images.py` (нужен Pillow).
- Товар в «Выбор La Fleur»: поле `featured: true`.
- Поводы: массив `occasion` у товара (`birthday`, `her`, `him`, `love`, `thanks`, `noreason`).

## Фото: единый шаблон и временные заглушки

Все фото товаров собираются скриптом на одном шаблоне: 1200×1500, тёплый каменный фон, мягкая тень, букет по центру. Для вырезания букета нужен `pip install "rembg[cpu]"`.

Источник фото для каждого товара задан в `SOURCES` в `scripts/process_images.py`. Сейчас временно (заглушки из фото партнёров):

| Товар | Временное фото |
|---|---|
| r3 Розовый рай | incoming/04 |
| r4 51 роза | incoming/05 |
| r6 Невеста | incoming/02 |
| p3 Мисти Баблс | incoming/08 |
| b4 Корзина XL | incoming/06 |
| плитки «Монобукеты», «Композиции», «Подарки» | incoming/03, 01, 07 |

Когда появится настоящее фото: положить его в `assets/products/src/<id>.jpg`, поправить строку в `SOURCES`, запустить скрипт.
