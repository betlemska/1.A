"""Recover only validated public JSON from the previous Pages deployment."""
import json,subprocess,sys
from pathlib import Path
from urllib.parse import urlparse
url=sys.argv[1].rstrip('/')+'/assets/lunch.json'
if urlparse(url).scheme!='https':raise SystemExit('Pages URL must be HTTPS')
try:
 p=subprocess.run(['curl','--fail','--location','--silent','--show-error','--proto','=https','--proto-redir','=https','--max-time','20','--max-filesize','2000000',url],capture_output=True,timeout=25,check=True)
 j=json.loads(p.stdout)
 if j.get('schemaVersion')!=1 or not isinstance(j.get('days'),dict) or not j['days']:raise ValueError('Invalid menu')
 from datetime import date,datetime
 datetime.fromisoformat(j['fetchedAt'].replace('Z','+00:00'))
 for day,record in j['days'].items():
  date.fromisoformat(day)
  if record.get('date')!=day or not isinstance(record.get('meals'),list):raise ValueError('Invalid date')
  if any(m.get('number') not in [1,2] for m in record['meals']):raise ValueError('Invalid meal')
 Path('assets/lunch.json').write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
 print('Recovered last published menu.')
except Exception:
 print('No valid earlier deployment; keeping the included snapshot.')
