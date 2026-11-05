"""Embed validated static snapshots and build only public website files."""
from pathlib import Path
import hashlib,json,re,shutil,os
r=Path(__file__).resolve().parents[1]
p=r/'index.html';page=p.read_text()
for ident,name in [('school-data','data'),('lunch-data','lunch'),('content-data','content')]:
 payload=json.dumps(json.loads((r/'assets'/f'{name}.json').read_text()),ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
 tag=f'<script type="application/json" id="{ident}">{payload}</script>'
 if f'id="{ident}"' in page:page=re.sub(fr'<script type="application/json" id="{ident}">.*?</script>',lambda _:tag,page,flags=re.S)
 else:page=page.replace('<script src="teacher-links.js',tag+'<script src="teacher-links.js')
# Pin a content-based worker revision so a deployment replaces old offline data.
fingerprint=hashlib.sha256((page+(r/'app.js').read_text()+(r/'style.css').read_text()).encode()).hexdigest()[:16]
sw=(r/'sw.js').read_text();sw=re.sub(r"const CACHE=PREFIX\+[^;]+;",f"const CACHE=PREFIX+'pages-{fingerprint}';",sw);(r/'sw.js').write_text(sw)
p.write_text(page)
out=r/'_site'
if out.exists():shutil.rmtree(out)
out.mkdir()
for name in ['index.html','style.css','app.js','teacher-links.js','teacher-links.css','calendar-core.js','celebrations.js','celebrations.css','presence.js','portal-core.js','floorplan.js','sw.js','manifest.webmanifest','.nojekyll','assets']:
 source=r/name
 if source.is_dir():shutil.copytree(source,out/name)
 elif source.exists():shutil.copy2(source,out/name)
print('Static site prepared; revision',fingerprint)
