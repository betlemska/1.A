(function(){'use strict';
let teacher,events=[];const status=document.querySelector('#preview-status'),C=window.BetlemskaCalendar;
function upcoming(md){const today=C.pragueDay(),year=Number(today.slice(0,4)),date=year+'-'+md;return date<today?(year+1)+'-'+md:date}
function birthday(){if(teacher?.birthDate)window.BetlemskaCelebrations.previewBirthday([teacher],upcoming(teacher.birthDate.slice(5)))}
document.querySelector('#advance-preview').addEventListener('click',()=>{if(!teacher)return;const actual=upcoming(teacher.birthDate.slice(5)),date=C.reminderDate(teacher,actual,events);window.BetlemskaCelebrations.previewAdvance([teacher],date,actual);status.textContent='Přání '+C.dateText(date)+' · narozeniny '+C.dateText(actual)});
document.querySelector('#birthday-preview').addEventListener('click',birthday);
document.querySelector('#nameday-preview').addEventListener('click',()=>{if(teacher)window.BetlemskaCelebrations.preview([teacher],upcoming(C.nameDays[teacher.first]))});
(async()=>{try{const response=await fetch(new URL('assets/data.json',document.baseURI));if(!response.ok)throw Error();const base=await response.json();let teachers=base.teachers;events=base.events;try{const r=await fetch(new URL('assets/content.json',document.baseURI),{signal:AbortSignal.timeout(5000)});if(r.ok){const shared=await r.json();teachers=shared.content?.teachers??teachers;events=shared.content?.events??events}}catch{}teacher=teachers.find(t=>t.id==='hynek-petros');if(!teacher?.birthDate)throw Error();status.textContent=teacher.name+' · ukázka pro '+C.dateText(upcoming(teacher.birthDate.slice(5)));birthday()}catch{status.textContent='Náhled se nepodařilo načíst. Obnov stránku.'}})();
})();
