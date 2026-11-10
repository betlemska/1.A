/* Schedule-based estimate. This is not an attendance feed. */
(function(root){
  'use strict';
  const hours=[['8:00','8:45'],['8:50','9:35'],['9:50','10:35'],['10:40','11:25'],['11:30','12:15'],['12:25','13:10'],['13:15','14:00'],['14:05','14:50'],['14:55','15:40'],['15:45','16:30']];
  const minutes=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
  const format=m=>`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`;
  function estimate(teacher,date,time,events=[]){
    const unknown={cls:'unknown',label:'Bez rozvrhu',detail:'Pro tento den není k dispozici platný rozvrh.'};
    if(!teacher.schedule?.length||date<'2026-10-12'||date>'2027-06-30')return unknown;
    const day=new Date(date+'T12:00:00Z').getUTCDay()-1;
    const absent=detail=>({cls:'no',label:'Mimo školu',detail});
    if(day<0||day>4)return absent('Víkend. Předpokládaná nepřítomnost podle rozvrhu.');
    if(events.some(e=>e.date===date&&e.allDay===true))return {cls:'unknown',label:'Školní akce',detail:'Celodenní školní akce bez běžné výuky. Přítomnost učitele nelze odvodit ze stálého rozvrhu.'};
    if(events.some(e=>e.date===date&&e.kind==='volno'))return absent('Prázdniny nebo svátek podle školního kalendáře.');
    const lessons=teacher.schedule.filter(l=>l.day===day&&hours[l.hour]);
    if(!lessons.length)return absent('Na dnešek není v dodaném rozvrhu uvedená výuka.');
    const first=Math.min(...lessons.map(l=>minutes(hours[l.hour][0]))),last=Math.max(...lessons.map(l=>minutes(hours[l.hour][1])));
    const interval=`${format(first)}–${format(last)}`;
    if(time<first||time>=last)return {...absent(`Dnešní rozvrh: ${interval}. Mimo tento interval předpokládáme nepřítomnost.`),interval};
    const lesson=lessons.find(l=>time>=minutes(hours[l.hour][0])&&time<minutes(hours[l.hour][1]));
    return {cls:'yes',label:'Ve škole',interval,lesson,detail:lesson?`Výuka ${hours[lesson.hour].join('–')} · ${lesson.cls} · ${lesson.room||'učebna neuvedena'}.`:`Mezi první a poslední hodinou (${interval}), právě bez výuky.`};
  }
  const api={hours,estimate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaPresence=api;
})(typeof window!=='undefined'?window:globalThis);
