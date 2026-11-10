(function(root){'use strict';
// Date-specific 1.A overrides. The recurring timetable remains the source of truth.
const weekday=date=>(new Date(date+'T12:00:00Z').getUTCDay()+6)%7;
const inClass=l=>(l.classes||[l.cls]).includes('1.A');
const sameSlot=(c,l,t,date)=>c.date===date&&c.hour===l.hour&&c.originalTeacherId===t.id&&(c.group||'')===(l.group||'')&&l.day===weekday(date)&&inClass(l);
function original(teachers,change){const t=teachers.find(t=>t.id===change.originalTeacherId),l=t?.schedule?.find(l=>sameSlot(change,l,t,change.date));return l?{teacher:t,lesson:l}:null}
function apply(teachers=[],changes=[],date,{includeCancelled=false}={}){
 if(!changes.some(c=>c.date===date))return teachers;
 const result=teachers.map(t=>({...t,schedule:[...(t.schedule||[])]}));
 for(const c of changes.filter(c=>c.date===date)){
  const o=original(teachers,c);if(!o)continue;
  const source=result.find(t=>t.id===c.originalTeacherId),target=result.find(t=>t.id===c.teacherId);
  if(c.kind!=='cancel'&&!target)continue;
  const index=source.schedule.findIndex(l=>sameSlot(c,l,source,date));if(index<0)continue;
  const l=source.schedule[index],others=(l.classes||[l.cls]).filter(cls=>cls!=='1.A');
  if(others.length)source.schedule[index]={...l,classes:others,cls:others.join(', ')};else source.schedule.splice(index,1);
  const changed={...o.lesson,classes:['1.A'],cls:'1.A',change:c,originalTeacherId:o.teacher.id,originalSubject:o.lesson.subject};
  if(c.kind==='cancel'){if(includeCancelled)source.schedule.push({...changed,cancelled:true})}
  else target.schedule.push({...changed,subject:c.subject,room:c.room||o.lesson.room,cancelled:false});
 }
 return result;
}
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const subjectNames={MAT:'Matematika',CJL:'Český jazyk a literatura',ANJ:'Anglický jazyk',FYZ:'Fyzika',CHE:'Chemie',BIO:'Biologie',MEC:'Mechanika',STT:'Strojírenská technologie',TEK:'Technické kreslení',TEV:'Tělesná výchova',DEJ:'Dějepis',EKO:'Ekonomika',ICT:'Informační a komunikační technologie',HRW:'Hardware',SPS:'Stavba a provoz strojů',CAD:'CAD',CAM:'CAM'};
function suppressesExam(exam,teachers,changes){
 return changes.some(c=>{if(c.date!==exam.date)return false;const o=original(teachers,c);if(!o)return false;const l=o.lesson;
  if(c.kind!=='cancel'&&c.subject===l.subject&&(!exam.teacherId||exam.teacherId===c.teacherId))return false;
  if(Number.isInteger(exam.hour)&&exam.hour!==c.hour)return false;
  if(!Number.isInteger(exam.hour)){const range=String(exam.time||'').match(/^(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?(?:\.?\s*(?:hod|$))/);if(!range||c.hour+1<Number(range[1])||c.hour+1>Number(range[2]||range[1]))return false}
  if(exam.teacherId&&exam.teacherId!==c.originalTeacherId)return false;
  if(exam.group&&(exam.group||'')!==(c.group||''))return false;
  return [norm(l.subject),norm(subjectNames[l.subject]||l.subject)].includes(norm(exam.subject));
 });
}
const api={apply,original,sameSlot,suppressesExam,subjectNames};


if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaLessonChanges=api;
})(typeof window!=='undefined'?window:globalThis);
