// Regression cases for local ZIP use, GitHub project paths and startup errors.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=fs.existsSync(path.join(__dirname,'../public/index.html'))?path.join(__dirname,'../public'):path.join(__dirname,'..');
const schoolData=JSON.parse(fs.readFileSync(path.join(base,'assets/data.json'),'utf8'));
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const embedded=html.match(/<script type="application\/json" id="school-data">([\s\S]*?)<\/script>/)[1];
assert.deepEqual(JSON.parse(embedded),schoolData,'HTML fallback must match source JSON');
async function boot(route,mode='http',hasEmbedded=true,savedFavorites=[],legacyClass='4.I',shared=null){
 const elements=new Map();const listeners={};const errors=[];let fetchCalls=0,requestedURL;
 const makeNode=()=>({innerHTML:'',textContent:'',dataset:{},value:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},close(){},focus(){},showModal(){}});
 const find=selector=>{if(selector==='#school-data'&&!hasEmbedded)return null;if(!elements.has(selector))elements.set(selector,makeNode());return elements.get(selector)};
 if(hasEmbedded)find('#school-data').textContent=embedded;find('#content-data').textContent=fs.readFileSync(path.join(base,'assets/content.json'),'utf8');find('#lunch-data').textContent=fs.readFileSync(path.join(base,'assets/lunch.json'),'utf8');find('#official-news-data').textContent=fs.readFileSync(path.join(base,'assets/school-news.json'),'utf8');
 class FixedDate extends Date {constructor(...args){super(...(args.length?args:["2026-11-05T08:00:00Z"]))}static now(){return new Date("2026-11-05T08:00:00Z").getTime()}}
 const context={Date:FixedDate,Intl,URL,URLSearchParams,AbortController,navigator:{onLine:true},console:{warn(){},error(...args){errors.push(args)}},setTimeout:fn=>{if(mode==='timeout')queueMicrotask(fn);return 0},clearTimeout(){},setInterval:()=>0,location:{hash:'#'+route,protocol:mode==='file'?'file:':'https:'},localStorage:{getItem:key=>key==='betlemska-favorites'?JSON.stringify(savedFavorites):key==='betlemska-class'?legacyClass:null,setItem(){}},document:{baseURI:'https://example.github.io/school/',querySelector:find,querySelectorAll:()=>[],addEventListener(type,fn){(listeners[type]||=([])).push(fn)}},fetch:async url=>{url=new URL(url,'https://example.github.io/school/');if(url.pathname.includes('/api/'))throw Error('Static export must never call API');if(url.href.endsWith('assets/data.json')){fetchCalls++;requestedURL=url.href;}if(mode==='file')throw Error('File fetch is blocked');if(mode==='blocked')throw Error('Network blocked');if(mode==='timeout')return new Promise(()=>{});return{ok:true,json:async()=>{if(mode==='bad-json')throw SyntaxError('Invalid JSON');return structuredClone(url.href.endsWith('assets/school-news.json')?JSON.parse(fs.readFileSync(path.join(base,'assets/school-news.json'),'utf8')):url.href.endsWith('assets/content.json')?JSON.parse(fs.readFileSync(path.join(base,'assets/content.json'),'utf8')):url.href.endsWith('assets/lunch.json')?JSON.parse(fs.readFileSync(path.join(base,'assets/lunch.json'),'utf8')):schoolData)}}}};
 context.window=context;context.addEventListener=()=>{};context.scrollTo=(x,y)=>{assert.equal(typeof x,'number','Use browser-compatible numeric scrollTo');assert.equal(typeof y,'number')};
 // A browser's legacy status property must remain untouched by application code.
 Object.defineProperty(context,'status',{get:()=>'',set:()=>{throw Error('Window.status collision')},configurable:false});
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(base,'teacher-links.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'presence.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'portal-core.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'lesson-changes.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'calendar-core.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'floorplan.js'),'utf8'),context);
 for(const file of ['preview-clock.js','class-week.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,'app.js'),'utf8'),context);
 await new Promise(setImmediate);await new Promise(setImmediate);
 return {elements,errors,fetchCalls,requestedURL,listeners};
}

(async()=>{
 const snapshot=JSON.parse(fs.readFileSync(path.join(base,'assets/content.json'),'utf8'));
 assert.deepEqual(JSON.parse(html.match(/id="content-data">([\s\S]*?)<\/script>/)[1]),snapshot);
 let cases=0;
 for(const mode of ['http','file','blocked','bad-json','timeout'])for(const route of ['home','news','teachers','schedule','events','plans','sources','canteen']){
  const r=await boot(route,mode);const main=r.elements.get('#main').innerHTML;
  assert.ok(main.includes('<h1>'),mode+'/'+route);
  assert.ok(!main.includes('<h1>Stránku se nepodařilo zobrazit.'),mode+'/'+route);
  assert.equal(r.errors.length,0,mode+'/'+route);
  if(route==='teachers')assert.equal((r.elements.get('#teacher-results').innerHTML.match(/class="teacher-card /g)||[]).length,snapshot.content.teachers.length);
  if(route==='events'){for(const exam of snapshot.content.exams)assert.ok(r.elements.get('#event-results').innerHTML.includes(exam.title),'Current exam survives without API');}
  if(route==='home'){assert.ok(main.includes('Oficiální web školy'));assert.ok(main.includes('Číst dál na webu školy'));}
  if(route==='canteen'){assert.ok(main.includes('45 Kč'));assert.ok(main.includes('jidelna.webp'));}
  cases++;
 }
 const code=fs.readFileSync(path.join(base,'app.js'),'utf8');
 assert.ok(!/api\/(menu|content|media|push|reports|admin)/.test(code));assert.ok(!code.includes('href="admin.html"'));
 assert.ok(html.includes('chatgpt.site/admin.html'));assert.ok(!html.includes('data-action="notifications"')&&!html.includes('data-action="report"'));

 for(const t of snapshot.content.teachers){for(const key of ['photo','pdf','video','scheduleSource']){const v=t[key];if(v?.startsWith('assets/'))assert.ok(fs.existsSync(path.join(base,v)),v)}}

 const worker=fs.readFileSync(path.join(base,'sw.js'),'utf8');
 const cached=JSON.parse(worker.match(/const CORE=(\[.*?\]);/s)[1]);
 for(const url of cached)assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),'Missing cached resource '+url);
 for(const name of ['class-week.js','lesson-changes.js','preview-clock.js'])assert.ok(cached.some(url=>url.startsWith(name)));
 const timetable=await boot('schedule','file');
 assert.ok(timetable.elements.get('#main').innerHTML.includes('data-pe-lesson='));
 console.log('Passed',cases,'static route/offline cases, current public content, profiles, canteen, official news, preserved exams and API removal.');
})().catch(e=>{console.error(e);process.exitCode=1});
