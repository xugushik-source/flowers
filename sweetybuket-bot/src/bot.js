import { byId, products, money } from './catalog.js';

const TOKEN=process.env.TELEGRAM_BOT_TOKEN;
const ADMIN=process.env.ADMIN_CHAT_ID;
if(!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is required');
const API='https://api.telegram.org/bot'+TOKEN;
const sessions=new Map();
const kb=(rows)=>({keyboard:rows.map(r=>r.map(text=>({text}))),resize_keyboard:true,one_time_keyboard:true});
async function api(method,body={}){const r=await fetch(API+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!j.ok) throw new Error(method+': '+j.description);return j.result;}
async function send(chat,text,reply_markup){return api('sendMessage',{chat_id:chat,text,reply_markup});}
function startSession(product){return {step:'occasion',product,occasion:'',date:'',budget:'',delivery:'',address:'',name:'',phone:'',comment:''};}
function menu(chat){return send(chat,'Здравствуйте! Я помощник Sweety Buket. Помогу подобрать букет и оформить заказ. Что хотите сделать?',kb([['🌷 Выбрать букет','⚡ Нужен букет сегодня'],['💎 Премиальные композиции','🎁 Подарок под бюджет']]));}
function productLine(p){return p.name+' — '+money(p.price);}
async function handle(chat,text,user){
 if(text.startsWith('/start')){
   const id=text.split(/\s+/)[1]; const p=id&&byId[id];
   if(p){sessions.set(chat,startSession(p));return send(chat,'Вы выбрали: '+productLine(p)+'\n\nДля кого букет?',kb([['Для девушки','Для мамы'],['Для жены','Для коллеги'],['Другой вариант']]));}
   sessions.delete(chat); return menu(chat);
 }
 if(text==='🌷 Выбрать букет'||text==='💎 Премиальные композиции'){
   const list=(text.startsWith('💎')?products.filter(p=>p.price>=39900):products).sort((a,b)=>a.price-b.price).slice(0,8);
   return send(chat,'Несколько вариантов:\n\n'+list.map(p=>'• '+productLine(p)).join('\n')+'\n\nНапишите название понравившегося букета или свой бюджет.');
 }
 if(text==='⚡ Нужен букет сегодня'||text==='🎁 Подарок под бюджет'){
   sessions.set(chat,{...startSession(null),step:'budget',occasion:text.startsWith('⚡')?'Срочно сегодня':''});
   return send(chat,'Какой бюджет планируете?',kb([['до 15 000 ₽','15–30 тыс. ₽'],['30–60 тыс. ₽','60–100 тыс. ₽'],['100 000 ₽ +']]));
 }
 let s=sessions.get(chat);
 if(!s){
   const p=products.find(x=>x.name.toLowerCase()===text.toLowerCase());
   if(p){sessions.set(chat,startSession(p));return send(chat,'Отличный выбор: '+productLine(p)+'\nДля кого букет?');}
   return menu(chat);
 }
 if(s.step==='occasion'){s.occasion=text;s.step='date';return send(chat,'Когда нужна доставка?',kb([['Сегодня','Завтра'],['Выбрать другую дату']]));}
 if(s.step==='date'){s.date=text;s.step='budget';return send(chat,'Какой ориентир по бюджету?',kb([['до 15 000 ₽','15–30 тыс. ₽'],['30–60 тыс. ₽','60–100 тыс. ₽'],['100 000 ₽ +']]));}
 if(s.step==='budget'){s.budget=text;s.step='delivery';return send(chat,'Куда доставить?',kb([['Москва','Московская область'],['Самовывоз']]));}
 if(s.step==='delivery'){s.delivery=text;s.step='address';return send(chat,text==='Самовывоз'?'Напишите имя получателя.':'Напишите адрес доставки.');}
 if(s.step==='address'){
   if(s.delivery==='Самовывоз'){s.name=text;s.step='phone';return send(chat,'Оставьте номер телефона для подтверждения заказа.');}
   s.address=text;s.step='name';return send(chat,'Как зовут получателя?');
 }
 if(s.step==='name'){s.name=text;s.step='phone';return send(chat,'Оставьте номер телефона для подтверждения заказа.');}
 if(s.step==='phone'){
   s.phone=text;s.step='confirm';
   const summary='Заявка Sweety Buket\n\n'+(s.product?'Букет: '+productLine(s.product)+'\n':'')+'Повод/получатель: '+s.occasion+'\nДата: '+s.date+'\nБюджет: '+s.budget+'\nДоставка: '+s.delivery+(s.address?'\nАдрес: '+s.address:'')+'\nПолучатель: '+s.name+'\nТелефон: '+s.phone;
   s.summary=summary; return send(chat,summary+'\n\nВсё верно?',kb([['✅ Отправить заказ'],['✏️ Начать заново']]));
 }
 if(text==='✏️ Начать заново'){sessions.delete(chat);return menu(chat);}
 if(text==='✅ Отправить заказ'&&s.summary){
   if(ADMIN) await send(ADMIN,s.summary+'\nTelegram: @'+(user.username||'нет username')+'\nChat ID: '+chat);
   sessions.delete(chat);return send(chat,'Спасибо. Заявка принята 🌷\nМенеджер Sweety Buket свяжется с вами для подтверждения состава, наличия, доставки и итоговой стоимости.',kb([['🌷 Выбрать букет','⚡ Нужен букет сегодня']]));
 }
 return menu(chat);
}
let offset=0;
console.log('Sweety Buket bot started');
while(true){
 try{
   const updates=await api('getUpdates',{offset,timeout:45,allowed_updates:['message']});
   for(const u of updates){offset=u.update_id+1;const m=u.message;if(m?.text) await handle(m.chat.id,m.text.trim(),m.from||{});}
 }catch(e){console.error(e.message);await new Promise(r=>setTimeout(r,2000));}
}
