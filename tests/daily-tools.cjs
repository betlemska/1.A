const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=fs.existsSync(path.join(__dirname,'../public/assets/data.json'))?path.join(__dirname,'../public'):path.join(__dirname,'..');
function load(name){const ctx={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),ctx);return ctx.module.exports}
const {daily,roomState,menuForDate}=load('portal-core.js'),{hours}=load('presence.js'),data=JSON.parse(fs.readFileSync(path.join(root,'assets/data.json'),'utf8'));
const day=t=>daily(data.teachers,'1.A','2026-10-27',t,data.events,hours);
for(const [minute,expected] of [[479,false],[480,false],[525,true],[529,true],[530,false],[1000,false]]) assert.equal(day(minute).isBreak,expected);
assert.equal(day(479).current.length,0);assert.equal(day(479).next[0].subject,'CJL');assert.equal(day(480).current[0].subject,'CJL');assert.equal(day(525).current.length,0);assert.equal(day(525).bell.minute,530);assert.equal(day(640).current[0].subject,'MAT');assert.equal(day(640).current[0].room,'U7');assert.equal(day(685).current.length,0);assert.equal(day(685).next[0].hour,4);assert.equal(day(1000).bell,undefined);assert.equal(day(1000).next.length,0);
assert.equal(daily(data.teachers,'1.A','2026-10-28',600,data.events,hours).isSchool,false);
assert.equal(daily(data.teachers,'1.A','2026-10-31',600,data.events,hours).lessons.length,0);
assert.equal(daily(data.teachers,'1.A','2027-09-01',600,data.events,hours).valid,false);
const room={lessons:[{day:1,hour:0,subject:'CJL',cls:'1.A'}]};
assert.equal(roomState(room,'2026-10-27',480,data.events,hours).kind,'occupied');
assert.equal(roomState(room,'2026-10-27',530,data.events,hours).kind,'unrecorded');
assert.equal(roomState(room,'2026-10-27',525,data.events,hours).kind,'unknown');
assert.equal(roomState(room,'2026-10-28',480,data.events,hours).kind,'unknown');
assert.equal(roomState({lessons:[]},'2026-10-27',480,data.events,hours).kind,'unknown');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),menu=JSON.parse(fs.readFileSync(path.join(root,'assets/lunch.json'),'utf8'));
assert.deepEqual(JSON.parse(html.match(/id="lunch-data">([\s\S]*?)<\/script>/)[1]),menu);
assert.equal(menu.schemaVersion,1);for(const [date,d] of Object.entries(menu.days)){assert.equal(date,d.date);assert.ok(d.meals.every(x=>[1,2].includes(x.number)));assert.ok(d.meals.length<=2)}
const dated={days:{'2026-10-27':{date:'2026-10-27',meals:[{number:1}]}}};assert.ok(menuForDate(dated,'2026-10-27'));assert.equal(menuForDate(dated,'2026-10-28'),null);assert.equal(menuForDate(null,'2026-10-27'),null);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./index.html#home');
console.log('Daily timetable, lesson/break boundaries, weekends/holidays, incomplete room coverage, exact-date menu and portable PWA paths passed.');
