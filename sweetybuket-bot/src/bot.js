import http from 'node:http';
import { byId, products, money } from './catalog.js';

const TOKEN=process.env.TELEGRAM_BOT_TOKEN;
const ADMIN=process.env.ADMIN_CHAT_ID;
const PAYMENT_URL=process.env.PAYMENT_URL || '';
if(!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is required');
const API='https://api.telegram.org/bot'+TOKEN;
const SITE='https://xugushik-source.github.io/flowers/sweetybuket/';
const IMG='https://xugushik-source.github.io/flowers/sweetybuket/assets/optimized/';
const SHOP='+7 916 589-66-00';
const SHOP_URL='https://t.me/+79165896600';
const sessions=new Map();
const reply=(rows)=>({keyboard:rows.map(r=>r.map(text=>({text}))),resize_keyboard:true});
const inline=(rows)=>({inline_keyboard:rows});
const btn=(text,data)=>({text,callback_data:data});
async function api(method,body={}){const r=await fetch(API+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!j.ok) throw new Error(method+': '+j.description);return j.result;}
const send=(chat,text,reply_markup)=>api('sendMessage',{chat_id:chat,text,reply_markup});
const caption=p=>'🌷 '+p.name+'\n'+money(p.price);
async function photo(chat,p,markup){
 // Не у всех фото есть вариант 800 (например, baskets-31935) — берём 480 как запасной.
 let ir=await fetch(IMG+p.id+'-card-800.jpg');
 if(!ir.ok) ir=await fetch(IMG+p.id+'-card-480.jpg');
 if(!ir.ok) throw new Error('imageFetch '+p.id+': HTTP '+ir.status);
 const bytes=await ir.arrayBuffer();
 const form=new FormData();
 form.set('chat_id',String(chat));
 form.set('caption',caption(p));
 form.set('reply_markup',JSON.stringify(markup));
 form.set('photo',new Blob([bytes],{type:'image/jpeg'}),p.id+'.jpg');
 const r=await fetch(API+'/sendPhoto',{method:'POST',body:form});
 const j=await r.json();
 if(!j.ok) throw new Error('sendPhoto '+p.id+': '+j.description);
 return j.result;
}
// Фото не отправилось — показываем ту же карточку текстом, чтобы товар не пропал из подборки.
async function card(chat,p,markup){
 try{const r=await photo(chat,p,markup);console.log('PHOTO_OK',p.id);return r;}
 catch(e){console.error('PHOTO_FAIL',p.id,e.message);return send(chat,caption(p),markup);}
}
function fresh(p=null){return {product:p,step:p?'date':'',date:'',slot:'',delivery:'',address:'',recipient:'',customer:'',phone:'',card:'',surprise:false};}
function home(chat){sessions.delete(chat);return send(chat,'🌷 Sweety Buket\n\nВыберите, как удобнее оформить подарок. Я покажу реальные варианты с фото и ценами — без длинной анкеты.',inline([
 [btn('⚡ Доставка сегодня','flow:today'),btn('✨ Подобрать за меня','flow:pick')],
 [btn('🌹 Каталог','cats'),btn('💎 WOW-подарки','flow:wow')],
 [btn('🍓 Цветы + клубника','cat:combo'),btn('🎁 До 30 000 ₽','budget:30000')],
 [{text:'Открыть весь сайт',url:SITE}]
]));}
function categoryName(c){return ({roses:'Розы',pions:'Пионы',mono:'Монобукеты',author:'Авторские',box:'Коробки',baskets:'Корзины',sweets:'Клубника',combo:'Цветы + клубника'})[c]||c;}
async function showList(chat,list,title){
 console.log('SHOW_LIST',chat,title,'count='+list.length);
 await send(chat,title+'\n\nСейчас покажу варианты карточками ниже 👇');
 if(!list.length) return send(chat,'В этой подборке сейчас нет вариантов. Посмотрите другие категории:',inline([[btn('Другие категории','cats'),btn('🏠 Главное меню','home')]]));
 for(const p of list.slice(0,6)) await card(chat,p,inline([[btn('❤️ Хочу этот','product:'+p.id),btn('Похожие','similar:'+p.id)]]));
 return send(chat,'Выше — варианты из этой подборки. Можно выбрать любой кнопкой «❤️ Хочу этот» или продолжить поиск:',inline([[btn('Показать по другому бюджету','budgets'),btn('Другие категории','cats')],[btn('🏠 Главное меню','home')]]));
}
function filteredBudget(max,min=0){return products.filter(p=>p.price>min&&p.price<=max).sort((a,b)=>a.price-b.price);}
async function chooseProduct(chat,p){
 if(!p)return send(chat,'Этот букет больше не в каталоге. Посмотрите похожие варианты:',inline([[btn('🌹 Каталог','cats'),btn('🏠 Главное меню','home')]]));
 sessions.set(chat,{...fresh(p),step:'date'});
 await card(chat,p,inline([[{text:'Посмотреть на сайте',url:SITE+'?product='+encodeURIComponent(p.id)}]]));
 return send(chat,'Отличный выбор. Когда нужен подарок?',inline([[btn('⚡ Сегодня','date:Сегодня'),btn('Завтра','date:Завтра')],[btn('Другая дата','date:other'),btn('← Назад в каталог','cats')]]));
}
async function orderSummary(chat,s){
 const total=s.product?s.product.price:0;
 const text='Ваш заказ 🌷\n\n'+
 'Букет: '+s.product.name+'\nЦена: '+money(total)+'\n'+
 'Дата: '+s.date+(s.slot?' · '+s.slot:'')+'\n'+
 'Получатель: '+s.recipient+'\n'+
 'Доставка: '+s.delivery+(s.address?'\nАдрес: '+s.address:'')+
 (s.card?'\nЗаписка: '+s.card:'')+(s.surprise?'\n🎁 Сюрприз — получателю заранее не звонить':'')+
 '\nТелефон заказчика: '+s.phone+
 '\n\nСтоимость доставки подтверждается менеджером.';
 s.summary=text;s.step='confirm';
 return send(chat,text,inline([[btn('✅ Всё верно — к оплате','confirm')],[btn('✏️ Начать заново','home')]]));
}
async function handleText(chat,text,user){
 if(text.startsWith('/start')){const id=text.split(/\s+/)[1];console.log('START',id||'-');if(id&&byId[id])return chooseProduct(chat,byId[id]);return home(chat);} // start=assistant и неизвестный id → главное меню помощника
 const s=sessions.get(chat);
 if(!s)return home(chat);
 if(s.step==='pick_budget'){const n=Number(text.replace(/\D/g,''));if(n>0)return showList(chat,filteredBudget(n),'Вот варианты в вашем бюджете:');return send(chat,'Напишите бюджет цифрами, например: 25000');}
 if(s.step==='date_other'){s.date=text;s.step='slot';return askSlot(chat);}
 if(s.step==='address'){s.address=text;s.step='recipient';return send(chat,'Как зовут получателя?');}
 if(s.step==='recipient'){s.recipient=text;s.step='card';return send(chat,'Добавим бесплатную записку?',inline([[btn('💌 Да, написать текст','card:yes'),btn('Без записки','card:no')]]));}
 if(s.step==='card_text'){s.card=text;s.step='surprise';return askSurprise(chat);}
 if(s.step==='customer'){s.customer=text;s.step='phone';return send(chat,'Оставьте номер телефона заказчика для подтверждения заказа.');}
 if(s.step==='phone'){s.phone=text;return orderSummary(chat,s);}
 return home(chat);
}
function askSlot(chat){return send(chat,'Какое время удобнее?',inline([[btn('9:00–12:00','slot:9:00–12:00'),btn('12:00–15:00','slot:12:00–15:00')],[btn('15:00–18:00','slot:15:00–18:00'),btn('18:00–21:00','slot:18:00–21:00')],[btn('21:00–24:00','slot:21:00–24:00'),btn('Уточнить позже','slot:Уточнить')]]));}
function askSurprise(chat){return send(chat,'Это сюрприз?',inline([[btn('🎁 Да, сюрприз','surprise:yes'),btn('Нет','surprise:no')]]));}
async function handleCallback(q){
 const chat=q.message.chat.id,d=q.data; await api('answerCallbackQuery',{callback_query_id:q.id}).catch(()=>{});
 if(d==='home')return home(chat);
 if(d==='cats')return send(chat,'Что хотите посмотреть?',inline([[btn('🌹 Розы','cat:roses'),btn('🌸 Пионы','cat:pions')],[btn('💐 Авторские','cat:author'),btn('🎩 Коробки','cat:box')],[btn('🧺 Корзины','cat:baskets'),btn('🌼 Монобукеты','cat:mono')],[btn('🍓 Клубника','cat:sweets'),btn('💝 Цветы + клубника','cat:combo')],[btn('🏠 Главное меню','home')]]));
 if(d.startsWith('cat:')){const c=d.slice(4);return showList(chat,products.filter(p=>p.category===c).sort((a,b)=>a.price-b.price),categoryName(c));}
 if(d==='flow:wow')return showList(chat,products.filter(p=>p.price>=39900).sort((a,b)=>b.price-a.price),'💎 Большие композиции, которые производят впечатление:');
 if(d==='flow:today')return showList(chat,products.filter(p=>p.category!=='sweets').sort((a,b)=>a.price-b.price).slice(0,6),'⚡ Варианты для заказа сегодня. Наличие подтвердит менеджер:');
 if(d==='flow:pick'){sessions.set(chat,{...fresh(),step:'pick_budget'});return send(chat,'Подберу без лишних вопросов. Какой максимальный бюджет в ₽?\nНапример: 25000');}
 if(d==='budgets')return send(chat,'Выберите бюджет:',inline([[btn('до 15 000 ₽','budget:15000'),btn('до 30 000 ₽','budget:30000')],[btn('30–60 тыс. ₽','range:30000:60000'),btn('60–100 тыс. ₽','range:60000:100000')],[btn('100 000 ₽ +','range:100000:999999'),btn('🏠 Меню','home')]]));
 if(d.startsWith('budget:'))return showList(chat,filteredBudget(Number(d.split(':')[1])),'Подходящие варианты:');
 if(d.startsWith('range:')){const [,a,b]=d.split(':').map(Number);return showList(chat,filteredBudget(b,a),'Подходящие варианты:');}
 if(d.startsWith('similar:')){const p=byId[d.slice(8)];if(!p)return chooseProduct(chat,null);return showList(chat,products.filter(x=>x.category===p.category&&x.id!==p.id).sort((a,b)=>Math.abs(a.price-p.price)-Math.abs(b.price-p.price)),'Похожие варианты:');}
 if(d.startsWith('product:'))return chooseProduct(chat,byId[d.slice(8)]);
 const s=sessions.get(chat); if(!s)return home(chat);
 if(d.startsWith('date:')){const v=d.slice(5);if(v==='other'){s.step='date_other';return send(chat,'Напишите дату, например: 5 октября');}s.date=v;s.step='slot';return askSlot(chat);}
 if(d.startsWith('slot:')){s.slot=d.slice(5);s.step='delivery';return send(chat,'Как получить заказ?',inline([[btn('🚗 Доставка Москва','delivery:Москва'),btn('🚙 Московская область','delivery:МО')],[btn('🏬 Самовывоз','delivery:Самовывоз')]]));}
 if(d.startsWith('delivery:')){s.delivery=d.slice(9);if(s.delivery==='Самовывоз'){s.step='recipient';return send(chat,'Как зовут получателя?');}s.step='address';return send(chat,'Напишите адрес доставки.');}
 if(d==='card:yes'){s.step='card_text';return send(chat,'Напишите текст записки — мы добавим её к подарку.');}
 if(d==='card:no'){s.card='';s.step='surprise';return askSurprise(chat);}
 if(d.startsWith('surprise:')){s.surprise=d.endsWith('yes');s.step='customer';return send(chat,'Как вас зовут?');}
 if(d==='confirm'){
   if(!s.summary)return home(chat);
   if(!ADMIN){console.error('ADMIN_CHAT_ID is not set: order not delivered to shop');return send(chat,'Заказ сформирован, но автоматически передать его магазину сейчас не получилось. Пожалуйста, перешлите сообщение с заказом выше в Telegram магазина: '+SHOP+' 🌷',inline([[{text:'Написать магазину',url:SHOP_URL}],[btn('🏠 Главное меню','home')]]));}
   await send(ADMIN,s.summary+'\nЗаказчик: '+s.customer+'\nTelegram: @'+(q.from.username||'нет username')+'\nChat ID: '+chat);
   s.step='payment';
   if(PAYMENT_URL)return send(chat,'Заказ сформирован. Нажмите кнопку для оплаты. После оплаты вернитесь сюда.',inline([[{text:'💳 Оплатить заказ',url:PAYMENT_URL}],[btn('✅ Я оплатил','paid'),btn('Связаться с менеджером','manager')]]));
   return send(chat,'Заказ сформирован ✅\n\n💳 Онлайн-оплата подключается. Платёжная кнопка появится здесь сразу после подключения ссылки Сбера/СБП.\n\nПока менеджер подтвердит наличие, доставку и способ оплаты.',inline([[btn('📩 Передать менеджеру','manager')],[btn('🏠 Главное меню','home')]]));
 }
 if((d==='manager'||d==='paid')&&!ADMIN){console.error('ADMIN_CHAT_ID is not set');return send(chat,'Не удалось связаться с менеджером автоматически. Напишите магазину напрямую: '+SHOP,inline([[{text:'Написать магазину',url:SHOP_URL}]]));}
 if(d==='manager'){await send(ADMIN,'⚡ Клиент ждёт связи\n'+(s.summary||'')+'\nTelegram: @'+(q.from.username||'нет username'));return send(chat,'Передал менеджеру. Он свяжется с вами для подтверждения заказа. 🌷');}
 if(d==='paid'){await send(ADMIN,'💳 Клиент нажал «Я оплатил». Нужна ручная проверка оплаты.\n'+(s.summary||''));return send(chat,'Спасибо. Мы получили отметку об оплате. Менеджер проверит поступление и подтвердит заказ. 🌷',inline([[btn('🏠 Главное меню','home')]]));}
}
const PORT=Number(process.env.PORT||10000);
http.createServer((req,res)=>{res.writeHead(200,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify({ok:true,service:'sweety-buket-bot'}));}).listen(PORT,'0.0.0.0',()=>console.log('Health server listening on '+PORT));
// Render при деплое шлёт SIGTERM старому экземпляру: выходим сразу, чтобы два getUpdates не конфликтовали (409).
// Неподтверждённые апдейты Telegram отдаст новому экземпляру.
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>{console.log(sig+': stopping polling');process.exit(0);});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let offset=0; console.log('Sweety Buket bot 2.0 started');
while(true){
 let updates;
 try{updates=await api('getUpdates',{offset,timeout:45,allowed_updates:['message','callback_query']});}
 catch(e){const conflict=/Conflict/.test(e.message);console.error(conflict?'POLL_CONFLICT (другой экземпляр ещё работает)':'POLL_ERROR',e.message);await sleep(conflict?5000:2000);continue;}
 for(const u of updates){
  offset=u.update_id+1;
  // Ошибка одного апдейта не должна ронять обработку остальных.
  try{if(u.callback_query)await handleCallback(u.callback_query);else if(u.message?.text)await handleText(u.message.chat.id,u.message.text.trim(),u.message.from||{});}
  catch(e){console.error('UPDATE_FAIL',u.update_id,e.message);}
 }
}
