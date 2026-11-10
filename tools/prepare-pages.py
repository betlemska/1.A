"""Embed dated public snapshots and assemble all public assets for project Pages."""
import hashlib,json,re,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def prepare():
    page=(ROOT/'index.html').read_text()
    for identifier,name in [('school-data','data'),('lunch-data','lunch'),('content-data','content'),('official-news-data','school-news')]:
        payload=json.dumps(json.loads((ROOT/'assets'/f'{name}.json').read_text()),ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
        tag=f'<script type="application/json" id="{identifier}">{payload}</script>'
        pattern=fr'<script type="application/json" id="{identifier}">.*?</script>'
        if re.search(pattern,page,re.S):page=re.sub(pattern,lambda _:tag,page,flags=re.S)
        else:page=page.replace('<script src="teacher-links.js',tag+'<script src="teacher-links.js',1)
    (ROOT/'index.html').write_text(page)
    files=[p for p in ROOT.iterdir() if p.is_file() and (p.suffix in ['.js','.css','.html'] or p.name in ['.nojekyll','manifest.webmanifest'])]
    files += [p for p in (ROOT/'assets').rglob('*') if p.is_file()]
    banned={'admin.js','admin.css','notifications.js','reports.js','admin.html'}
    files=[p for p in files if p.name not in banned]
    worker=(ROOT/'sw.js').read_text()
    for tag in re.findall(r'<(?:script|link)\b[^>]+>',page):
        match=re.search(r'(?:src|href)="([^"]+)"',tag)
        if match:
            asset=match[1].split('?')[0]
            if not asset.startswith(('https:','http:','#')) and not (ROOT/asset).is_file():raise ValueError('Missing public asset '+asset)
    digest=hashlib.sha256()
    for file in sorted(files):
        if file.name=='sw.js':continue
        digest.update(file.relative_to(ROOT).as_posix().encode());digest.update(file.read_bytes())
    revision=digest.hexdigest()[:16]
    worker=re.sub(r"const CACHE=PREFIX\+[^;]+;",f"const CACHE=PREFIX+'pages-{revision}';",worker)
    urls=['index.html','assets/data.json','assets/lunch.json','assets/content.json','assets/school-news.json','assets/app-icon-192.png','assets/app-icon-512.png','assets/apple-touch-icon.png','assets/school-logo.png','assets/school-building.jpg','assets/jidelna.webp','manifest.webmanifest']
    for tag in re.findall(r'<(?:script|link)\b[^>]+>',page):
        match=re.search(r'(?:src|href)="([^"]+)"',tag)
        if match and not match[1].startswith(('https:','http:','#')):urls.append(match[1])
    worker=re.sub(r'const CORE=\[.*?\];','const CORE='+json.dumps(list(dict.fromkeys(urls)))+';',worker,flags=re.S)
    (ROOT/'sw.js').write_text(worker)
    output=ROOT/'_site'
    if output.exists():shutil.rmtree(output)
    output.mkdir()
    for file in files:
        target=output/file.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,target)
    (output/'assets/version.json').write_text(json.dumps({'release':'2','revision':revision})+'\n')
    print('Static Pages v2 built; revision',revision)
if __name__=='__main__':prepare()
