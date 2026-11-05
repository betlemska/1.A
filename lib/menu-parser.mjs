// Pure parser for the public school menu. No DOM, eval or remote JS execution.
export const MENU_SOURCE = 'https://jidelna.betlemska.cz/ejidelnicek/menu/';
export const MENU_TIMEZONE = 'Europe/Prague';

const entities = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
export function plainText(value) {
  return String(value ?? '').replace(/<[^>]*>/g,' ').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match,code)=>{
    if(code[0]==='#') {
      const point = code[1].toLowerCase()==='x' ? parseInt(code.slice(2),16) : Number(code.slice(1));
      return point > 0 && point <= 0x10ffff && !(point>=0xd800&&point<=0xdfff) ? String.fromCodePoint(point) : '\uFFFD';
    }
    return entities[code.toLowerCase()] ?? match;
  }).replace(/\s+/g,' ').trim();
}

function readJSONArgument(source) {
  const match = /\bejidelnicek\s*\.\s*setJidelnicek\s*\(\s*/.exec(source);
  if(!match) throw new Error('Public menu JSON not found');
  const start = match.index+match[0].length;
  if(source[start]!=='{') throw new Error('Expected a JSON object');
  let depth=0,inString=false,escaped=false;
  for(let i=start;i<source.length;i++) {
    const ch=source[i];
    if(inString) {
      if(escaped) escaped=false;
      else if(ch==='\\') escaped=true;
      else if(ch==='"') inString=false;
    } else if(ch==='"') inString=true;
    else if(ch==='{'||ch==='[') depth++;
    else if(ch==='}'||ch===']') {
      depth--;
      if(depth===0) {
        if(!/^\s*\)/.test(source.slice(i+1))) throw new Error('Unexpected content after JSON');
        return JSON.parse(source.slice(start,i+1));
      }
    }
  }
  throw new Error('Unterminated public menu JSON');
}

const object = value => value && typeof value==='object' && !Array.isArray(value);
export function parseMenuHTML(source, fetchedAt=new Date().toISOString()) {
  if(typeof source!=='string'||source.length>2_000_000) throw new Error('Invalid or oversized public menu');
  const raw=readJSONArgument(source);
  if(!object(raw.stravaMap)) throw new Error('Missing public stravaMap');
  const lunches=Object.values(raw.stravaMap).filter(meal=>object(meal)&&(String(meal.id)==='3'||plainText(meal.nazev).toLocaleLowerCase('cs')==='oběd'));
  if(lunches.length!==1||!object(lunches[0].denMap)) throw new Error('Expected one public lunch denMap');
  const days={};
  for(const [date,record] of Object.entries(lunches[0].denMap).sort(([a],[b])=>a.localeCompare(b))) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!object(record)) continue;
    const parsedDate=new Date(date+'T12:00:00Z');
    if(!Number.isFinite(parsedDate.getTime())||parsedDate.toISOString().slice(0,10)!==date) continue;
    const sourceMenus=record.menuMap??{};
    if(!object(sourceMenus)) throw new Error('Invalid menuMap on '+date);
    const meals=[];
    for(const number of ['1','2']) {
      let item=Object.values(sourceMenus).find(item=>object(item)&&String(item.dMenu)===number);
      if(!item) {
        const candidate=sourceMenus[number];
        if(object(candidate)&&[undefined,null,'',number].includes(candidate.dMenu)) item=candidate;
      }
      if(item&&plainText(item.nazev)) meals.push({number:Number(number),name:plainText(item.nazev),allergens:plainText(item.alergZobr)});
    }
    const soups=(Array.isArray(record.polevka)?record.polevka:[]).filter(item=>object(item)&&plainText(item.polevka))
      .map(item=>({name:plainText(item.polevka),allergens:plainText(item.alergZobr)}));
    // Holidays are stored in polevka by the official service; don't call them soup.
    days[date]={date,label:plainText(record.datumden),closed:meals.length===0,
      message:meals.length?'':soups.map(s=>s.name).join(' · '),
      soups:meals.length?soups:[],meals,drink:plainText(record.napoj),extra:plainText(record.zakusek)};
  }
  if(!Object.keys(days).length) throw new Error('Public menu has no valid dates');
  return {schemaVersion:1,source:MENU_SOURCE,timezone:MENU_TIMEZONE,fetchedAt,days};
}

// Suitable for a server-only Next/Vinext route. Never accepts a user-supplied URL.
// Module cache is per isolate; CDN response caching may reduce upstream requests further.
let cached=null,expiresAt=0,inFlight=null;
export async function getPublicMenu({force=false}={}) {
  if(!force&&cached&&Date.now()<expiresAt) return cached;
  if(inFlight) return inFlight;
  inFlight=(async()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch(MENU_SOURCE,{signal:controller.signal,redirect:'manual',headers:{Accept:'text/html','User-Agent':'BetlemskaStudentPortal/1.0 (public menu reader)'}});
      if(!response.ok||!(response.headers.get('content-type')||'').includes('text/html')) throw new Error('School menu is unavailable');
      const length=Number(response.headers.get('content-length')||0);
      if(length>2_000_000) throw new Error('Oversized school menu');
      const chunks=[];let size=0;
      const reader=response.body.getReader();
      try {
        while(true) {
          const {done,value}=await reader.read();
          if(done) break;
          size+=value.byteLength;
          if(size>2_000_000) throw new Error('Oversized school menu');
          chunks.push(value);
        }
      } finally {reader.releaseLock();}
      const bytes=new Uint8Array(size);let offset=0;
      for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
      cached=parseMenuHTML(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
      expiresAt=Date.now()+10*60*1000;
      return cached;
    } finally {clearTimeout(timer);}
  })();
  try{return await inFlight;}finally{inFlight=null;}
}
