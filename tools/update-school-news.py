"""Update the latest official article from the school's public RSS, atomically."""
import argparse,html,json,re,subprocess,tempfile
from datetime import datetime,timezone
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import xml.etree.ElementTree as ET
SOURCE='https://betlemska.cz/aktuality?format=feed&type=rss'
class Text(HTMLParser):
    def __init__(self):super().__init__(convert_charrefs=True);self.parts=[]
    def handle_data(self,value):self.parts.append(value)
def plain(value):
    parser=Text();parser.feed(value or '')
    return ' '.join(' '.join(parser.parts).split())
def latest(xml):
    if len(xml)>2_000_000 or b'<!DOCTYPE' in xml.upper() or b'<!ENTITY' in xml.upper():
        raise ValueError('Unsupported feed')
    entries=[]
    for item in ET.fromstring(xml).findall('./channel/item'):
        title=plain(item.findtext('title'))
        link=(item.findtext('link') or '').strip()
        parsed=urlparse(link)
        if parsed.scheme!='https' or parsed.netloc not in ['www.betlemska.cz','betlemska.cz'] or not parsed.path.startswith('/aktuality/'):
            continue
        from email.utils import parsedate_to_datetime
        try:stamp=parsedate_to_datetime(item.findtext('pubDate')).astimezone(timezone.utc)
        except (ValueError,TypeError):continue
        if not title:continue
        description=plain(item.findtext('description'))
        excerpt=re.sub(r'\s+\S*$','',description[:175])+'…' if len(description)>175 else description
        entries.append(dict(title=title,excerpt=excerpt,url=link,date=stamp.isoformat().replace('+00:00','Z')))
    if not entries:raise ValueError('No valid school articles')
    result=max(entries,key=lambda a:a['date'])
    result['fetchedAt']=datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
    return result
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--input',type=Path);args=parser.parse_args()
    raw=args.input.read_bytes() if args.input else subprocess.run(['curl','--fail','--location','--silent','--show-error','--proto','=https','--proto-redir','=https','--max-time','20','--max-filesize','2000000',SOURCE],capture_output=True,check=True,timeout=25).stdout
    article=latest(raw)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w',dir=args.output.parent,delete=False,encoding='utf-8') as tmp:
        json.dump(article,tmp,ensure_ascii=False,indent=2);tmp.write('\n');name=tmp.name
    Path(name).replace(args.output)
    print('Updated official school article:',article['title'])
if __name__=='__main__':main()
