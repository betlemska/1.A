(function(){'use strict';
const key='betlemska-preview-clock-v1';
function validDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||v<'2000-01-01'||v>'2100-12-31')return false;const d=new Date(v+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===v}
function read(){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v&&validDate(v.date)&&(!v.time||/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time))?{date:v.date,time:v.time||''}:null}catch{return null}}
function parts(){const o={};new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(p=>o[p.type]=p.value);const v=read();if(v){[o.year,o.month,o.day]=v.date.split('-');if(v.time)[o.hour,o.minute]=v.time.split(':')}return o}
function set(date,time=''){if(!validDate(date)||time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Zadej platné datum a čas.');localStorage.setItem(key,JSON.stringify({date,time}));window.dispatchEvent(new Event('betlemska-clock-change'))}
function reset(){localStorage.removeItem(key);window.dispatchEvent(new Event('betlemska-clock-change'))}
window.addEventListener('storage',e=>{if(e.key===key||e.key===null)window.dispatchEvent(new Event('betlemska-clock-change'))});
window.BetlemskaPreviewClock={read,parts,set,reset,key};
})();
