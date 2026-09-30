/* ==========================================================================
   La Fleur — catalogue data
   All product data lives here. Names, prices and descriptions are carried
   over unchanged from the previous version of the site.

   To add or replace a product photo: drop the file into assets/products/src/
   (named by product id) and run `python3 scripts/process_images.py`.
   ========================================================================== */
window.LF_DATA = (function () {
  var WHATSAPP = '995579145634';          // existing La Fleur number (from the old site)
  var PHONE_DISPLAY = '+995 579 145 634';

  /* Existing business rules from the previous site */
  var DELIVERY = { fee: 15, freeFrom: 150 };
  var SLOTS = ['9:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'];

  /* Collections. Empty categories stay visible (marked "Скоро") so the
     structure is complete; add products with that `category` to fill them.
     Tiles for empty categories use temporary partner photos. */
  var CATEGORIES = [
    { id: 'roses',        name: 'Розы',            tile: 'r4' },
    { id: 'pions',        name: 'Пионы',           tile: 'p1' },
    { id: 'author',       name: 'Авторские',       tile: 'm2', long: 'Авторские букеты' },
    { id: 'mono',         name: 'Монобукеты',      tile: 'tile-mono' },
    { id: 'compositions', name: 'Композиции',      tile: 'tile-compositions' },
    { id: 'box',          name: 'Коробки',         tile: 'b1', long: 'Цветы в коробке' },
    { id: 'gifts',        name: 'Подарки',         tile: 'tile-gifts' }
  ];

  /* Occasion tiles. The occasion tags on products below are an initial
     merchandising suggestion — the owner should confirm or edit them. */
  var OCCASIONS = [
    { id: 'birthday', name: 'День рождения' },
    { id: 'her',      name: 'Для неё' },
    { id: 'him',      name: 'Для него' },
    { id: 'love',     name: 'Любовь' },
    { id: 'thanks',   name: 'Благодарность' },
    { id: 'noreason', name: 'Без повода' }
  ];

  /* Add-ons offered inside the product sheet ("Добавить к подарку").
     `card` is handled separately as the note card. */
  var ADDONS = {
    uc:  { name: 'Рафаэлло 200г',    short: 'Рафаэлло',   price: 25, image: 'e1' },
    um:  { name: 'Merci 250г',       short: 'Merci',      price: 22, image: 'e2' },
    ub:  { name: 'Шарик-сердце',     short: 'Шарик',      price: 12, image: 'e3' },
    uk:  { name: 'Открытка',         short: 'Открытка',   price: 0,  image: 'e4', card: true },
    us:  { name: 'Шампанское Brut',  short: 'Шампанское', price: 45, image: 'e5' },
    ubr: { name: 'Мишка 30 см',      short: 'Мишка',      price: 35, image: 'e6' }
  };

  /* Products. `addons` = the upsell list the old site used for each bouquet. */
  var PRODUCTS = [
    { id: 'r1', name: 'Море любви',    category: 'roses',  price: 120, description: '15 красных роз, гипсофила, атласная лента', badge: 'Хит', featured: true,
      occasion: ['love', 'her'], addons: ['uc', 'uk', 'ub', 'us'] },
    { id: 'r2', name: 'Страсть',       category: 'roses',  price: 160, oldPrice: 180, description: '25 роз Эквадор, крафт-упаковка',
      occasion: ['love', 'her'], addons: ['uc', 'um', 'ubr', 'ub'] },
    { id: 'r3', name: 'Розовый рай',   category: 'roses',  price: 140, description: '21 розовая роза, эвкалипт, лента', badge: 'Новинка',
      occasion: ['her', 'birthday', 'noreason'], addons: ['uk', 'um', 'ub', 'us'] },
    { id: 'r4', name: '51 роза',       category: 'roses',  price: 320, description: '51 красная роза, монобукет',
      occasion: ['love', 'her', 'birthday'], addons: ['us', 'uc', 'ubr', 'uk'] },
    { id: 'r5', name: 'Солнце',        category: 'roses',  price: 110, description: '15 жёлтых роз, зелень',
      occasion: ['birthday', 'thanks', 'noreason', 'him'], addons: ['uk', 'um', 'ub', 'uc'] },
    { id: 'r6', name: 'Невеста',       category: 'roses',  price: 145, description: '21 белая роза, гипсофила',
      occasion: ['her', 'thanks'], addons: ['us', 'uk', 'uc', 'ubr'] },

    { id: 'p1', name: 'Бабл Роуз',     category: 'pions',  price: 150, description: '17 пионовидных роз, нежно-розовые', badge: 'Хит', featured: true,
      occasion: ['her', 'birthday'], addons: ['uc', 'uk', 'ub', 'um'] },
    { id: 'p2', name: 'Лиловый сон',   category: 'pions',  price: 165, description: '15 пионов лиловых, фисташка',
      occasion: ['her', 'thanks'], addons: ['um', 'us', 'uk', 'ubr'] },
    { id: 'p3', name: 'Мисти Баблс',   category: 'pions',  price: 180, description: '21 кустовая пионовидная роза',
      occasion: ['her', 'birthday', 'noreason'], addons: ['uc', 'uk', 'ub', 'us'] },
    { id: 'p4', name: 'Весна',         category: 'pions',  price: 200, oldPrice: 230, description: '25 пионов микс, сезон',
      occasion: ['her', 'noreason'], addons: ['us', 'uc', 'ubr', 'uk'] },

    { id: 'm1', name: 'Мия',           category: 'author', price: 155, description: 'Розы, эустома, гербера, зелень',
      occasion: ['birthday', 'her', 'noreason'], addons: ['uc', 'uk', 'ub', 'um'] },
    { id: 'm2', name: 'Джульетта',     category: 'author', price: 190, description: 'Пионы, розы, лизиантус, эвкалипт', badge: 'Хит', featured: true,
      occasion: ['her', 'birthday', 'love'], addons: ['us', 'uc', 'uk', 'ubr'] },
    { id: 'm3', name: 'Прованс',       category: 'author', price: 130, description: 'Подсолнухи, хризантемы, лаванда',
      occasion: ['him', 'thanks', 'noreason'], addons: ['um', 'uk', 'ub', 'uc'] },
    { id: 'm4', name: 'Акварель',      category: 'author', price: 145, description: 'Пастельные оттенки, 15 стеблей', badge: 'Новинка',
      occasion: ['birthday', 'thanks', 'noreason'], addons: ['uk', 'uc', 'ub', 'um'] },

    { id: 'b1', name: '5 Историй',        category: 'box', price: 180, description: 'Пять сортов роз в шляпной коробке', badge: 'Хит', featured: true,
      occasion: ['birthday', 'her'], addons: ['us', 'ubr', 'uc', 'uk'] },
    { id: 'b2', name: 'Красные в белой',  category: 'box', price: 160, description: 'Красные розы в белой коробке',
      occasion: ['love', 'him'], addons: ['us', 'uc', 'ubr', 'uk'] },
    { id: 'b3', name: 'Сердце',           category: 'box', price: 170, description: 'Розы в коробке-сердечке, 25 бутонов',
      occasion: ['love', 'her'], addons: ['us', 'ubr', 'um', 'uk'] },
    { id: 'b4', name: 'Корзина XL',       category: 'box', price: 250, description: 'Пионы и розы, корзина, XL',
      occasion: ['birthday', 'thanks'], addons: ['us', 'uc', 'uk', 'ubr'] },

    /* Gifts sold on their own (the old "Допы" section) */
    { id: 'e1', name: 'Рафаэлло 200г',  category: 'gifts', price: 25, description: 'Классика к букету' },
    { id: 'e2', name: 'Merci 250г',     category: 'gifts', price: 22, description: 'Шоколадный набор' },
    { id: 'e3', name: 'Шарик-сердце',   category: 'gifts', price: 12, description: 'Фольгированный' },
    { id: 'e4', name: 'Открытка',       category: 'gifts', price: 0,  description: 'С вашим текстом' },
    { id: 'e5', name: 'Шампанское',     category: 'gifts', price: 45, description: 'Brut 0.75л' },
    { id: 'e6', name: 'Мишка',          category: 'gifts', price: 35, description: 'Плюшевый 30 см' }
  ];

  /* Ready-made gift sets (the old "Комбо"). Prices unchanged. */
  var COMBOS = [
    { id: 'cmb1', name: 'Романтика', price: 180, oldPrice: 200, image: 'cmb1',
      description: '25 красных роз Эквадор · Рафаэлло 200г · Открытка с вашим текстом',
      items: ['25 красных роз Эквадор', 'Рафаэлло 200г', 'Открытка с вашим текстом'],
      occasion: ['love', 'her'], card: true },
    { id: 'cmb2', name: 'Нежность', price: 170, oldPrice: 185, image: 'cmb2',
      description: '15 розовых пионов · Merci 250г · Шарик-сердце фольгированный',
      items: ['15 розовых пионов', 'Merci 250г', 'Шарик-сердце фольгированный'],
      occasion: ['her', 'birthday'] }
  ];

  return {
    WHATSAPP: WHATSAPP, PHONE_DISPLAY: PHONE_DISPLAY,
    DELIVERY: DELIVERY, SLOTS: SLOTS,
    CATEGORIES: CATEGORIES, OCCASIONS: OCCASIONS,
    ADDONS: ADDONS, PRODUCTS: PRODUCTS, COMBOS: COMBOS
  };
})();

/* All interface copy in one place (ТЗ §62). */
window.LF_TEXT = {
  currency: '₾',
  free: 'Бесплатно',
  choose: 'Выбрать',
  addToCart: 'Добавить в корзину',
  added: 'Добавлено',
  checkout: 'Оформить',
  items: function (n) { var m10 = n % 10, m100 = n % 100; return n + ' ' + (m10 === 1 && m100 !== 11 ? 'товар' : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? 'товара' : 'товаров'); },
  allCats: 'Все',
  occasionChip: 'Повод',
  soon: 'Скоро',
  emptyCategory: 'Коллекция готовится. Напишите нам в WhatsApp — соберём букет под ваш запрос.',
  writeUs: 'Написать в WhatsApp',
  emptyFilter: 'Для этого сочетания пока нет букетов. Посмотрите всю коллекцию или напишите нам — соберём под ваш повод.',
  showAll: 'Показать все',
  cardAdd: 'Добавить открытку',
  cardFree: 'бесплатно',
  cardPlaceholder: 'Напишите несколько слов…',
  addonsTitle: 'Добавить к подарку',
  compositionLbl: 'Состав',
  totalLbl: 'Итого',
  save: function (n) { return 'Экономия ' + n + ' ₾'; },
  wasPrice: 'Обычная цена',
  cartEmpty: 'Корзина пуста',
  delivery: 'Доставка',
  pickup: 'Самовывоз',
  deliveryFee: function (fee, from) { return fee + ' ₾ · бесплатно от ' + from + ' ₾'; },
  pickupNote: 'Ахалкалаки · бесплатно',
  today: 'Сегодня',
  tomorrow: 'Завтра',
  anyTime: 'Уточним в WhatsApp',
  errRequired: 'Заполните отмеченные поля',
  errEmpty: 'Добавьте хотя бы один букет',
  waOpened: 'Открываем WhatsApp. Корзина сохранена, пока вы не отправите сообщение.',
  clearCart: 'Очистить корзину',
  remove: 'Убрать',
  cardFor: 'Открытка',
  surprise: 'Это сюрприз',
  wa: {
    hello: 'Здравствуйте! Хочу заказать:',
    bouquet: 'Букет',
    qty: 'Количество',
    extra: 'Дополнительно',
    card: 'Открытка',
    customer: 'Заказчик',
    recipient: 'Получатель',
    address: 'Адрес',
    time: 'Желаемое время',
    comment: 'Комментарий',
    surprise: 'Это сюрприз — не сообщайте получателю заранее',
    total: 'Итого',
    deliveryLine: 'Доставка',
    none: '—',
    pickup: 'Самовывоз',
    clarify: 'уточним'
  }
};
