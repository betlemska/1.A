/* Pure schedule helpers shared by the UI and regression tests. */
(function(root){
'use strict';
const mins=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
const dayIndex=date=>new Date(date+'T12:00:00Z').getUTCDay()-1;
const valid=date=>date>='2026-10-12'&&date<='2027-06-30';
function schoolDay(date,events=[]){const d=dayIndex(date);return valid(date)&&d>=0&&d<5&&!events.some(e=>e.date===date&&e.kind==='volno')}
function daily(teachers,cls,date,time,events,hours){
 const day=dayIndex(date),isSchool=schoolDay(date,events);
 const lessons=isSchool?teachers.flatMap(t=>t.schedule.filter(l=>l.day===day&&(l.classes||[l.cls]).includes(cls)).map(l=>({...l,teacher:t}))).sort((a,b)=>a.hour-b.hour):[];
 const current=lessons.filter(l=>time>=mins(hours[l.hour][0])&&time<mins(hours[l.hour][1]));
 const nextHour=lessons.find(l=>mins(hours[l.hour][0])>time)?.hour;
 const next=nextHour===undefined?[]:lessons.filter(l=>l.hour===nextHour);
 const bells=isSchool?hours.flatMap((h,i)=>[{minute:mins(h[0]),kind:'Začátek',hour:i},{minute:mins(h[1]),kind:'Konec',hour:i}]).sort((a,b)=>a.minute-b.minute):[];
 const bell=bells.find(b=>b.minute>time);
 return {lessons,current,next,bell,isSchool,valid:valid(date),holiday:events.find(e=>e.date===date&&e.kind==='volno')};
}
function roomState(room,date,time,events,hours){
 if(!schoolDay(date,events))return {kind:'unknown',label:'Mimo platnou výuku',lessons:[]};
 const hour=hours.findIndex(h=>time>=mins(h[0])&&time<mins(h[1]));
 if(hour<0)return {kind:'unknown',label:'Právě není vyučovací hodina',lessons:[]};
 const lessons=room.lessons.filter(l=>l.day===dayIndex(date)&&l.hour===hour);
 if(!room.lessons.length)return {kind:'unknown',label:'Bez rozvrhu místnosti',lessons:[]};
 return {kind:lessons.length?'occupied':'unrecorded',label:lessons.length?'Výuka dle rozvrhu':'Bez záznamu výuky · odhad',lessons};
}
function menuForDate(menu,date){const day=menu?.days?.[date];return day?.date===date?day:null}
const api={daily,roomState,schoolDay,dayIndex,mins,menuForDate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaPortal=api;
})(typeof window!=='undefined'?window:globalThis);
