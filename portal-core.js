/* Pure schedule helpers shared by the UI and regression tests. */
(function(root){
'use strict';
const mins=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
const dayIndex=date=>new Date(date+'T12:00:00Z').getUTCDay()-1;
const valid=date=>date>='2026-10-12'&&date<='2027-06-30';
function schoolDay(date,events=[]){const d=dayIndex(date);return valid(date)&&d>=0&&d<5&&!events.some(e=>e.date===date&&(e.kind==='volno'||e.allDay===true))}
function daily(teachers,cls,date,time,events,hours){
 const day=dayIndex(date),isSchool=schoolDay(date,events);
 const lessons=isSchool?teachers.flatMap(t=>t.schedule.filter(l=>l.day===day&&(l.classes||[l.cls]).includes(cls)).map(l=>({...l,teacher:t}))).sort((a,b)=>a.hour-b.hour):[];
 const current=lessons.filter(l=>time>=mins(hours[l.hour][0])&&time<mins(hours[l.hour][1]));
 const nextHour=lessons.find(l=>mins(hours[l.hour][0])>time)?.hour;
 const next=nextHour===undefined?[]:lessons.filter(l=>l.hour===nextHour);
 const bells=isSchool?hours.flatMap((h,i)=>[{minute:mins(h[0]),kind:'Začátek',hour:i},{minute:mins(h[1]),kind:'Konec',hour:i}]).sort((a,b)=>a.minute-b.minute):[];
 const bell=bells.find(b=>b.minute>time);
 const isBreak=next.length>0 && lessons.some(l=>l.hour===nextHour-1 && time>=mins(hours[l.hour][1]));
 return {lessons,current,next,bell,isBreak,isSchool,valid:valid(date),holiday:events.find(e=>e.date===date&&(e.kind==='volno'||e.allDay===true))};
}
function roomState(room,date,time,events,hours){
 if(!schoolDay(date,events))return {kind:'unknown',label:'Mimo platnou výuku',lessons:[]};
 const hour=hours.findIndex(h=>time>=mins(h[0])&&time<mins(h[1]));
 if(hour<0)return {kind:'unknown',label:'Právě není vyučovací hodina',lessons:[]};
 const lessons=room.lessons.filter(l=>l.day===dayIndex(date)&&l.hour===hour);
 if(!room.lessons.length)return {kind:'unknown',label:'Bez rozvrhu místnosti',lessons:[]};
 return {kind:lessons.length?'occupied':'unrecorded',label:lessons.length?'Výuka dle rozvrhu':'Bez záznamu výuky · odhad',lessons};
}
function lunchSlot(lessons,day,hour){const occupied=lessons.filter(l=>l.day===day).map(l=>l.hour);return !occupied.includes(hour)&&occupied.some(h=>h<hour)&&occupied.some(h=>h>hour)}
function teacherDuties(text){
 const duties=[],dayNames=['Po','Út','St','Čt','Pá'];let section;
 for(const line of String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean)){
  if(/^Suplovací pohotovost(?:\s*\(SP\))?$/i.test(line)){section={kind:'standby',label:'Suplovací pohotovost',code:'SP'};continue}
  const heading=line.match(/^(?:Dohled|Dozor)\s+(.+?)(?:\s+\(([^)]+)\))?$/i);
  if(heading){section={kind:/jídelně/i.test(heading[1])?'dining':'corridor',label:'Dozor '+heading[1],code:heading[2]||''};continue}
  let matched=false;
  for(const match of line.matchAll(/(Po|Út|St|Čt|Pá)\s*:\s*([^;]+)/g)){
   matched=true;if(!section)continue;
   const slot=match[2].match(/(před\s+)?((?:\d{1,2}\.\s*,?\s*)+)hod\b/i);
   if(!slot)continue;
   for(const number of slot[2].matchAll(/(\d+)\./g)){
    const hour=Number(number[1])-1;if(hour<0||hour>9)continue;
    const duty={...section,day:dayNames.indexOf(match[1]),hour,before:!!slot[1]};
    if(!duties.some(d=>d.day===duty.day&&d.hour===hour&&d.kind===duty.kind&&d.label===duty.label&&d.before===duty.before))duties.push(duty);
   }
  }
  // An unknown heading must never inherit the previous section's meaning.
  if(!matched)section=undefined;
 }
 return duties.sort((a,b)=>a.day-b.day||a.hour-b.hour||Number(b.before)-Number(a.before));
}
function dutyInterval(duty,hours){const h=hours[duty.hour];if(!h)return null;return duty.before?{start:duty.hour?mins(hours[duty.hour-1][1]):null,end:mins(h[0])}:{start:mins(h[0]),end:mins(h[1])}}
function menuForDate(menu,date){const day=menu?.days?.[date];return day?.date===date?day:null}
const api={daily,roomState,schoolDay,dayIndex,mins,menuForDate,lunchSlot,teacherDuties,dutyInterval};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaPortal=api;
})(typeof window!=='undefined'?window:globalThis);
