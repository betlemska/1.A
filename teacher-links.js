(function(root){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const marks={
 facebook:'<path fill="currentColor" d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.4A24 24 0 0 0 15 1c-3 0-5 1.9-5 5.4V9H7v4h3v9z"/>',
 instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>',
 web:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/>'
};
const names={facebook:'Facebook',instagram:'Instagram',web:'Web'};
function describe(link){
 let url;try{url=new URL(String(link?.url||''))}catch{return null}
 if(url.protocol!=='https:'||url.username||url.password)return null;
 const host=url.hostname.toLowerCase(),is=domain=>host===domain||host.endsWith('.'+domain);
 const kind=is('facebook.com')||host==='fb.com'?'facebook':is('instagram.com')?'instagram':'web';
 return{kind,url:url.href,label:String(link?.label||names[kind]).trim()||names[kind],name:names[kind]};
}
function icon(kind){return `<svg class="teacher-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${marks[kind]||marks.web}</svg>`}
function links(teacher,{compact=false}={}){
 const seen=new Set(),items=(teacher?.externalLinks||[]).map(describe).filter(l=>l&&!seen.has(l.url)&&seen.add(l.url));
 if(!items.length)return '';
 return `<div class="teacher-social-links${compact?' teacher-social-links--compact':''}" aria-label="Odkazy · ${esc(teacher.name)}">${items.map(l=>`<a class="teacher-social-link teacher-social-link--${l.kind}" data-social-kind="${l.kind}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(l.name+' · '+teacher.name+' · '+l.label+' (nová karta)')}" title="${esc(l.label+' · '+l.url)}">${icon(l.kind)}<span>${esc(compact?l.name:l.label)}</span><span class="teacher-link-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>`;
}
function preview(link){const l=describe(link);return `<span class="teacher-link-preview" data-link-preview>${icon(l?.kind||'web')}<span>${esc(l?.name||'Web')}<small>Ikona podle adresy</small></span></span>`}
const api={describe,icon,links,preview};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaTeacherLinks=api;
})(typeof window!=='undefined'?window:globalThis);
