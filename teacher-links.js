(function(root){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const marks={
 facebook:'<path fill="currentColor" d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.4A24 24 0 0 0 15 1c-3 0-5 1.9-5 5.4V9H7v4h3v9z"/>',
 instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>',
 youtube:'<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/>',
 web:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/>'
};
const names={facebook:'Facebook',instagram:'Instagram',youtube:'YouTube',web:'Web'};
function describe(link){
 let url;try{url=new URL(String(link?.url||''))}catch{return null}
 if(url.protocol!=='https:'||url.username||url.password)return null;
 const host=url.hostname.toLowerCase(),is=domain=>host===domain||host.endsWith('.'+domain);
 const kind=is('facebook.com')||host==='fb.com'?'facebook':is('instagram.com')?'instagram':is('youtube.com')||host==='youtu.be'?'youtube':'web';
 return{kind,url:url.href,label:String(link?.label||names[kind]).trim()||names[kind],name:names[kind]};
}
function icon(kind){return `<svg class="teacher-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${marks[kind]||marks.web}</svg>`}
function links(teacher,{compact=false}={}){
 const seen=new Set(),items=(teacher?.externalLinks||[]).map(describe).filter(l=>l&&!seen.has(l.url)&&seen.add(l.url));
 if(!items.length)return '';
 return `<div class="teacher-social-links${compact?' teacher-social-links--compact':''}" aria-label="Odkazy · ${esc(teacher.name)}">${items.map(l=>`<a class="teacher-social-link teacher-social-link--${l.kind}" data-social-kind="${l.kind}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(l.name+' · '+teacher.name+' · '+l.label+' (nová karta)')}" title="${esc(l.label+' · '+l.url)}">${icon(l.kind)}<span>${esc(compact?l.name:l.label)}</span><span class="teacher-link-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>`;
}
function preview(link){const l=describe(link);return `<span class="teacher-link-preview" data-link-preview>${icon(l?.kind||'web')}<span>${esc(l?.name||'Web')}<small>Ikona podle adresy</small></span></span>`}
// School profiles and visitor comments selected by the site editor.
const reviewProfiles = {
 'lucie-asali': {url:'https://www.oznamkujucitele.cz/ucitel/208771',quote:'a the'},
 'karel-bernat': {"url": "https://www.oznamkujucitele.cz/ucitel/198479", "quote": "Farjer jak svině❤. Až vyrostu tak chci být stejnej pussydestroyer jako on🔥💦👉👌"},
 'zdenek-kouril': {"url": "https://www.oznamkujucitele.cz/ucitel/211456", "quote": "zdenda je asi nejchytřejší učitel na celé škole od mechaniky až po stroje a matematiku a navíc tančí jako drak 🐉. ne nadarmo má titul krále maturitních plesů a absolutního frajera. jestli ho bolševik vyhodí tak nemá smysl sem chodit."},
 'vladislav-liszok': {"url": "https://www.oznamkujucitele.cz/ucitel/211459", "quote": "borec umí z dvouminutový konverzace udělat operu o délce tří hodin, překvapilo mě že na dod kecal jen patnáct minut namísto dvou hodin"},
 'andrea-pavlova': {"url": "https://www.oznamkujucitele.cz/ucitel/212210", "quote": "bro si vymejsli picoviny a protireci si ale je funny se s ni hadat kdyz vis ze mas pravdu (ale stejne si vymysli nejakou kktinu abys tu pravdu nemel)"},
 'barbora-pivonkova': {"url": "https://www.oznamkujucitele.cz/ucitel/214114", "quote": "Absolutní baller, na její hodiny se vždycky těším, literatura s ní mě začala opravdu bavit, díky ní jsem začal číst\n\nŽádný češtinář by mě nenaučil na maturitu tak dobře jako ona\n\nŠkola by si jí měla vážit jako banka žida"},
 'pavel-pokorny': {"url": "https://www.oznamkujucitele.cz/ucitel/211413", "quote": "je npc. je to very shy cute anime girl, která se bojí toho, že řeknete dobrý den. nikdo ho ani nerespektuje a každej na mobajl phounu."},
 'michal-prutyszyn': {"url": "https://www.oznamkujucitele.cz/ucitel/209805", "quote": "Lepší než ten čúrak žilka. Kámoší se s tellingerem i kdyz je to nejvetsi curak betlemsky, klikoval s nejakym typkem a dela ze sebe frajera"},
 'ondrej-ruzicka': {"url": "https://www.oznamkujucitele.cz/ucitel/206824", "quote": "ano, je to počítačem ovládaná entita. pokud půjdete o hodině třeba na záchod nebo se vysmrkat, dostanete jeden z jeho předem naprogramovaných odpovědí. tempo výuky pomalé, hodně krát chyběl. kdybychom s ním měli jít k maturitám, nedali bychom je. kdybychom šli do zaměstnání, vyhodili by nás, protože nic neumíme. konstrukční cvičení by vám uznal, i kdyby jste mu to dali načmárané od ruky na kusu toaletního papíru. nebo mu to vůbec nedávejte, pouhý výpočet bez výkresu dostanete tak 3- nebo 4."},
 'radka-stefanakova': {"url": "https://www.oznamkujucitele.cz/ucitel/222556", "quote": "Takova mistni fine shyt mega bych ji ohnul"},
 'ladislav-trnka': {"url": "https://www.oznamkujucitele.cz/ucitel/211658", "quote": "měl jsem tady výhodu v tom, že mě bavila chemie. nepomáhá. zadává příklad nebo vykládá něco z prezentace a na to se máme naučit. není to tak těžké, ale učitel nepomáhá. u mě to bylo jedno, protože jsem většinou všemu rozuměl. kdyby byly otázky, tak by byly většinou z věcí týkající se chemie, ale ne učiva chemie. na testech máme až příliš moc málo času. nemůžu tak rychle psát!také má zvláštní hnusný zápach. zajímá mě z čeho to je."},
 'martin-vyroubal': {"url": "https://www.oznamkujucitele.cz/ucitel/205656", "quote": "krásný den, kde berete to matro protože bych ho chtěl taky, fakt super člověk vždy zlepší náladu"},
 'lubomir-martinec': {url:'https://www.oznamkujucitele.cz/ucitel/209801'},
 'martin-theimer': {"url": "https://www.oznamkujucitele.cz/ucitel/222596", "quote": "Už od druháku mam problem s ISIC a nemůžu se čipnout do školy. Ted už sem v třeťáku a ten zkurvenej čurák ani na po třinactý není schopnej to spravně načipovat prostě kokot."}
};
function review(teacher){
 const item=reviewProfiles[teacher?.id];if(!item)return '';
 return `<section class="profile-section teacher-review"><h3>Oznámkuj učitele</h3>${item.quote?`<blockquote><p>„${esc(item.quote)}“</p><footer>Vybraný komentář návštěvníka Oznámkuj učitele · Názor autora, nikoli stanovisko tohoto webu${item.subject?' · '+esc(item.subject):''}${item.date?' · '+esc(item.date):''}</footer></blockquote>`:''}<a class="teacher-social-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Hodnocení · ${esc(teacher.name)} · Oznámkuj učitele (nová karta)">${icon('web')}<span>${item.quote?'Původní hodnocení':'Přečíst hodnocení'}</span><span aria-hidden="true">↗</span></a></section>`;
}
const api={describe,icon,links,preview,review};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaTeacherLinks=api;
})(typeof window!=='undefined'?window:globalThis);
