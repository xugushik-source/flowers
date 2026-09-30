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
