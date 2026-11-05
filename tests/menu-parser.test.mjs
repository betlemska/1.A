import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseMenuHTML,plainText,getPublicMenu} from '../lib/menu-parser.mjs';
const html=fs.readFileSync(new URL('./fixtures/public-menu.html',import.meta.url),'utf8');
const menu=parseMenuHTML(html,'2026-10-27T10:00:00.000Z');
assert.equal(Object.keys(menu.days).length,15);
const today=menu.days['2026-10-27'];
assert.equal(today.closed,false);
assert.equal(today.soups[0].name,'Zeleninová s krupicí');
assert.equal(today.meals.length,2);
assert.equal(today.meals[0].name,'Kuřecí stehení řízek přírodní,hranolky,dip');
assert.equal(today.meals[1].name,'Obalovaná treska ,letní bramborový salát');
assert.equal(today.meals[0].allergens,'(obsahuje alergeny:7)');
assert.equal(menu.days['2026-10-28'].closed,true);
assert.deepEqual(menu.days['2026-10-28'].soups,[]);
assert.equal(menu.days['2026-10-28'].message,'Státní svátek');
assert.equal(menu.days['2026-10-29'].message,'Podzimní prázdniny');
assert.equal(menu.days['2026-10-31'],undefined);
assert.equal(plainText('<b>A&amp;B</b>&nbsp;&#x10d;'),'A&B č');
for(const bad of ['<html>Login</html>','ejidelnicek.setJidelnicek({});','ejidelnicek.setJidelnicek({"stravaMap":{}});','ejidelnicek.setJidelnicek({"stravaMap":{})']) assert.throws(()=>parseMenuHTML(bad));
// JSON strings containing braces and escaped quotes are data, never executable code.
const fake={stravaMap:{0:{id:3,denMap:{'2026-10-27':{menuMap:{1:{dMenu:'1',nazev:'A } \\" B'}},polevka:[]}}}}};
assert.equal(parseMenuHTML('ejidelnicek.setJidelnicek('+JSON.stringify(fake)+');').days['2026-10-27'].meals[0].name,'A } \\" B');
console.log('Passed real 15-day fixture, standard/diet choices, closure notices, malformed JSON and escaping tests.');
if(process.argv.includes('--live')) {
  const live=await getPublicMenu();
  assert.equal(Object.keys(live.days).length>0,true);
  assert.strictEqual(await getPublicMenu(),live);
  console.log('Live public menu fetch and cache reuse passed:',live.fetchedAt,Object.keys(live.days).length,'days');
}
