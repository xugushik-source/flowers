/* ==========================================================================
   SweetyBuket — catalogue data
   Photos and names come from Instagram @sweetybuket (`source` = the post).
   TEST PRICES IN RUBLES: temporary market-oriented prices for sales-flow testing.
   Replace with the shop's confirmed prices before launch.
   ========================================================================== */
window.LF_DATA = (function () {
  var WHATSAPP = '79165896600';           // from @sweetybuket captions (Telegram/WhatsApp)
  var WHATSAPP_2 = '79153735330';
  var PHONE_DISPLAY = '+7 916 589-66-00';

  /* Order channels. WhatsApp is blocked in Russia (since Feb 2026), so it is
     off by default. Fill `max` with the shop's MAX link when it exists. */
  var CHANNELS = {
    telegram: '79165896600',       // opens the chat; the order text is copied for pasting
    max: '',                       // e.g. 'https://max.ru/...'
    whatsapp: '',                  // leave empty while WhatsApp is blocked in RF
    phones: ['+7 916 589-66-00', '+7 915 373-53-30']
  };

  /* Seller details required on the site (Закон о защите прав потребителей,
     Правила дистанционной продажи, 152-ФЗ). FILL BEFORE LAUNCH — empty
     fields are shown as «уточняется». */
  var LEGAL = {
    seller: 'ИП Эваджян Асмик Арутюновна',
    inn: '640404370256',
    ogrnip: '319645100093662',
    address: '',       // адрес для претензий и запросов по персональным данным
    email: '',         // e-mail для запросов субъектов персональных данных
    updated: '02.10.2026'
  };

  var DELIVERY = null;                    // delivery cost unknown: confirmed with the customer
  var SLOTS = ['9:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00', '21:00-24:00'];

  var CATEGORIES = [
    { id: 'roses',   name: 'Розы',        tile: 'roses-44983' },
    { id: 'pions',   name: 'Пионы',       tile: 'pions-68983' },
    { id: 'mono',    name: 'Монобукеты',  tile: 'mono-24449' },
    { id: 'author',  name: 'Авторские',   tile: 'author-38532', long: 'Авторские букеты' },
    { id: 'box',     name: 'Коробки',     tile: 'box-48473',    long: 'Цветы в коробке' },
    { id: 'baskets', name: 'Корзины',     tile: 'baskets-02065' },
    { id: 'sweets',  name: 'Клубника',    tile: 'sweets-34377', long: 'Клубника в шоколаде' },
    { id: 'combo',   name: 'Комбо',       tile: 'combo-04823',  long: 'Цветы + клубника' }
  ];
  var DESC = {
    roses: 'Букет из роз', pions: 'Букет с пионами', mono: 'Монобукет', author: 'Авторский букет',
    box: 'Цветы в коробке', baskets: 'Цветочная корзина', sweets: 'Клубника в шоколаде', combo: 'Букет + клубника в шоколаде'
  };

  var OCCASIONS = [
    { id: 'her',      name: 'Для неё' },
    { id: 'birthday', name: 'День рождения' },
    { id: 'noreason', name: 'Без повода' },
    { id: 'love',     name: 'Любовь' },
    { id: 'thanks',   name: 'Спасибо' },
    { id: 'evening',  name: 'Особенный вечер' }
  ];
  /* "Любимые букеты": most-liked posts with the strongest photos, in this order */
  var FEATURED = ['roses-90333', 'pions-68983', 'box-48473', 'author-38532', 'baskets-75781', 'mono-04608'];

  var ADDONS = {};
  var COMBOS = [];

  var PRODUCTS = [
    { id: 'roses-44983', name: 'Садовые розы', category: 'roses', price: 12900, description: '', occasion: ["love", "her", "evening", "birthday"], source: 'https://www.instagram.com/p/DFHZ7_DohSj/' },
    { id: 'roses-90333', name: 'Яркие кустовые розы', category: 'roses', price: 18900, description: '', occasion: ["love", "her", "evening", "birthday"], source: 'https://www.instagram.com/p/DaiA1VviN-9/' },
    { id: 'roses-07023', name: 'Пионовидные розы', category: 'roses', price: 24900, description: '', occasion: ["love", "her", "evening", "birthday"], source: 'https://www.instagram.com/p/DPqsXb5iNTB/' },
    { id: 'roses-26614', name: 'Коралловые розы', category: 'roses', price: 15900, description: '', occasion: ["love", "her", "evening", "birthday"], source: 'https://www.instagram.com/p/DFYF15KI6fY/' },
    { id: 'roses-81477', name: 'Красно-белые розы', category: 'roses', price: 21900, description: '', occasion: ["love", "her", "evening", "birthday"], source: 'https://www.instagram.com/p/DOBlX7jCIRF/' },
    { id: 'roses-26641', name: 'Кустовые розы', category: 'roses', price: 17900, description: '', occasion: ["love", "her", "evening", "birthday"], source: 'https://www.instagram.com/p/DNIphkCIrN-/' },
    { id: 'pions-58736', name: '51 пион', category: 'pions', price: 39900, description: '', occasion: ["her", "birthday", "love"], source: 'https://www.instagram.com/p/DZziFxeiNV5/' },
    { id: 'pions-93826', name: 'Сирень и пионы', category: 'pions', price: 32900, description: '', occasion: ["her", "birthday", "love"], source: 'https://www.instagram.com/p/DXd6u1liFTk/' },
    { id: 'pions-68983', name: 'Пионы', category: 'pions', price: 24900, description: '', occasion: ["her", "birthday", "love"], source: 'https://www.instagram.com/p/DKlt-TgNWNL/' },
    { id: 'mono-04748', name: 'Хризантема «Мамока»', category: 'mono', price: 9900, description: '', occasion: ["noreason", "thanks", "birthday"], source: 'https://www.instagram.com/p/DdY8yvegBm-/' },
    { id: 'mono-04608', name: 'Подсолнухи', category: 'mono', price: 11900, description: '', occasion: ["noreason", "thanks", "birthday"], source: 'https://www.instagram.com/p/DYHHu8liDB4/' },
    { id: 'mono-24449', name: 'Тюльпаны', category: 'mono', price: 12900, description: '', occasion: ["noreason", "thanks", "birthday"], source: 'https://www.instagram.com/p/DGpwo6xsuvT/' },
    { id: 'mono-69794', name: 'Ромашки', category: 'mono', price: 8900, description: '', occasion: ["noreason", "thanks", "birthday"], source: 'https://www.instagram.com/p/DMKJq0pM6Tc/' },
    { id: 'mono-29884', name: 'Диантусы', category: 'mono', price: 10900, description: '', occasion: ["noreason", "thanks", "birthday"], source: 'https://www.instagram.com/p/DFDOQf1IOvK/' },
    { id: 'mono-74587', name: 'Гортензии', category: 'mono', price: 15900, description: '', occasion: ["noreason", "thanks", "birthday"], source: 'https://www.instagram.com/p/DKo4knHsQ66/' },
    { id: 'author-60748', name: 'Сборный букет', category: 'author', price: 19900, description: '', occasion: ["birthday", "her", "thanks", "evening"], source: 'https://www.instagram.com/p/DbN3Y_AiLLW/' },
    { id: 'author-84643', name: 'Нежность', category: 'author', price: 24900, description: '', occasion: ["birthday", "her", "thanks", "evening"], source: 'https://www.instagram.com/p/DGOG9tqIjWe/' },
    { id: 'author-17459', name: 'Осенний букет', category: 'author', price: 28900, description: '', occasion: ["birthday", "her", "thanks", "evening"], source: 'https://www.instagram.com/p/DP0rWT5CDJf/' },
    { id: 'author-38532', name: 'Синие орхидеи', category: 'author', price: 34900, description: '', occasion: ["birthday", "her", "thanks", "evening"], source: 'https://www.instagram.com/p/DReXvcCiNYw/' },
    { id: 'author-67614', name: 'Осенняя композиция', category: 'author', price: 39900, description: '', occasion: ["birthday", "her", "thanks", "evening"], source: 'https://www.instagram.com/p/DPQ7JdeCILE/' },
    { id: 'author-59154', name: 'Букет невесты из калл', category: 'author', price: 29900, description: '', occasion: ["birthday", "her", "thanks", "evening"], source: 'https://www.instagram.com/p/DbdFn2AiPsj/' },
    { id: 'box-31122', name: 'Шляпная коробка', category: 'box', price: 44900, description: '', occasion: ["birthday", "love", "her", "evening"], source: 'https://www.instagram.com/p/DNf2thCxkOi/' },
    { id: 'box-48351', name: 'Сердце с надписью', category: 'box', price: 54900, description: '', occasion: ["birthday", "love", "her", "evening"], source: 'https://www.instagram.com/p/DFfax9XobB8/' },
    { id: 'box-58109', name: 'Пастельная коробка', category: 'box', price: 39900, description: '', occasion: ["birthday", "love", "her", "evening"], source: 'https://www.instagram.com/p/DFLW7yxockN/' },
    { id: 'box-48473', name: 'Коробка с потайным ящиком', category: 'box', price: 69900, description: '', occasion: ["birthday", "love", "her", "evening"], source: 'https://www.instagram.com/p/DQMplTrCMN3/' },
    { id: 'box-25475', name: 'Розы в боксе', category: 'box', price: 49900, description: '', occasion: ["birthday", "love", "her", "evening"], source: 'https://www.instagram.com/p/DFKySitoz3p/' },
    { id: 'baskets-02065', name: 'Летняя корзина', category: 'baskets', price: 79000, description: '', occasion: ["birthday", "thanks"], source: 'https://www.instagram.com/p/Dbs2BJAiDU8/' },
    { id: 'baskets-75781', name: 'Весенняя корзина', category: 'baskets', price: 99000, description: '', occasion: ["birthday", "thanks"], source: 'https://www.instagram.com/p/DWgD9v6CKS6/' },
    { id: 'baskets-31935', name: 'Корзина с жемчугом', category: 'baskets', price: 149000, description: '', occasion: ["birthday", "thanks"], source: 'https://www.instagram.com/p/DP1BLgqCEEm/' },
    { id: 'sweets-45389', name: 'Клубника в шоколаде', category: 'sweets', price: 6900, description: '', occasion: ["love", "noreason", "birthday"], source: 'https://www.instagram.com/p/DGn_0fUIxTK/' },
    { id: 'sweets-77254', name: 'Сладкое признание', category: 'sweets', price: 8900, description: '', occasion: ["love", "noreason", "birthday"], source: 'https://www.instagram.com/p/DGN3PvjoiEH/' },
    { id: 'sweets-34377', name: 'Ягодный микс', category: 'sweets', price: 11900, description: '', occasion: ["love", "noreason", "birthday"], source: 'https://www.instagram.com/p/DGdgVVvqwNo/' },
    { id: 'combo-04823', name: 'Гортензии + клубника', category: 'combo', price: 24900, description: '', occasion: ["birthday", "love", "her"], source: 'https://www.instagram.com/p/DGLchEcog8b/' },
    { id: 'combo-65036', name: 'Пионы + клубника', category: 'combo', price: 34900, description: '', occasion: ["birthday", "love", "her"], source: 'https://www.instagram.com/p/DKxGlisIsVN/' },
    { id: 'combo-72485', name: 'Эустома + клубника', category: 'combo', price: 29900, description: '', occasion: ["birthday", "love", "her"], source: 'https://www.instagram.com/p/DPlKKdNiF2C/' },
  ];
  PRODUCTS.forEach(function (p) { if (!p.description) p.description = DESC[p.category]; });

  /* Short reels from Instagram (assets/video). */
  var REELS = [
    { file: 'reel2', title: 'Дофаминовая корзина', source: 'https://www.instagram.com/reel/DcJ0Kx1I3e9/' },
    { file: 'reel1', title: 'Гармоничный микс', source: 'https://www.instagram.com/reel/DdT-05zADji/' },
    { file: 'reel3', title: 'Охапка счастья', source: 'https://www.instagram.com/reel/DdWsN-cgGuy/' },
    { file: 'reel4', title: 'Трендовая упаковка', source: 'https://www.instagram.com/reel/DdduhkaIzwf/' }
  ];

  return {
    WHATSAPP: WHATSAPP, WHATSAPP_2: WHATSAPP_2, PHONE_DISPLAY: PHONE_DISPLAY,
    DELIVERY: DELIVERY, SLOTS: SLOTS,
    CATEGORIES: CATEGORIES, OCCASIONS: OCCASIONS,
    ADDONS: ADDONS, PRODUCTS: PRODUCTS, FEATURED: FEATURED, CHANNELS: CHANNELS, LEGAL: LEGAL, COMBOS: COMBOS, REELS: REELS,
    INSTAGRAM: 'https://www.instagram.com/sweetybuket/'
  };
})();

window.LF_TEXT = {
  currency: '₽',
  onRequest: 'Цена по запросу',
  from: 'от',
  deliveryAsk: 'уточним',
  deliveryShort: 'Москва и МО',
  deliveryNote: 'Доставка по Москве и Московской области. Заказы принимаем круглосуточно. Стоимость доставки и итоговую цену подтвердим в переписке или по телефону.',
  free: 'Бесплатно',
  choose: 'Выбрать',
  addToCart: 'Добавить в корзину',
  added: 'Добавлено',
  checkout: 'Оформить',
  items: function (n) { var m10 = n % 10, m100 = n % 100; return n + ' ' + (m10 === 1 && m100 !== 11 ? 'товар' : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? 'товара' : 'товаров'); },
  allCats: 'Все',
  occasionChip: 'Повод',
  soon: 'Скоро',
  emptyCategory: 'Коллекция готовится. Напишите нам — соберём букет под ваш запрос.',
  writeUs: 'Написать в Telegram',
  emptyFilter: 'Для этого сочетания пока нет позиций. Посмотрите всю коллекцию или напишите нам — соберём под ваш повод.',
  showAll: 'Показать все',
  cardAdd: 'Добавить записку',
  cardFree: 'бесплатно',
  cardPlaceholder: 'Напишите несколько слов…',
  addonsTitle: 'Добавить к подарку',
  compositionLbl: 'Состав',
  totalLbl: 'Итого',
  save: function (n) { return 'Экономия ' + n + ' ₽'; },
  wasPrice: 'Обычная цена',
  cartEmpty: 'Корзина пуста',
  delivery: 'Доставка',
  pickup: 'Самовывоз',
  deliveryFee: function (fee, from) { return fee + ' ₽ · бесплатно от ' + from + ' ₽'; },
  pickupNote: 'Москва',
  today: 'Сегодня',
  tomorrow: 'Завтра',
  anyTime: 'Уточним при подтверждении',
  errRequired: 'Заполните отмеченные поля',
  errConsent: 'Отметьте согласие на обработку персональных данных — без него мы не можем принять заказ.',
  errEmpty: 'Добавьте хотя бы один букет',
  copied: 'Заказ скопирован. Вставьте его в чат.',
  waOpened: 'Открываем WhatsApp. Корзина сохранена, пока вы не отправите сообщение.',
  clearCart: 'Очистить корзину',
  remove: 'Убрать',
  cardFor: 'Записка',
  surprise: 'Это сюрприз',
  wa: {
    hello: 'Здравствуйте! Хочу заказать с сайта SweetyBuket:',
    bouquet: 'Букет',
    qty: 'Количество',
    extra: 'Дополнительно',
    card: 'Записка',
    customer: 'Заказчик',
    recipient: 'Получатель',
    address: 'Адрес',
    time: 'Желаемое время',
    comment: 'Комментарий',
    surprise: 'Это сюрприз — не сообщайте получателю заранее',
    total: 'Итого',
    totalAsk: 'прошу подтвердить стоимость',
    deliveryLine: 'Доставка',
    none: '—',
    pickup: 'Самовывоз',
    clarify: 'уточним'
  }
};
