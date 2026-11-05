#!/usr/bin/env python3
"""Public lunch snapshot; stdlib only. Never executes remote JavaScript.

python tools/update_lunch.py --output assets/lunch.json
python tools/update_lunch.py --input fixture.html --output /tmp/lunch.json
"""
import argparse
import datetime as dt
import html
import json
import os
import re
import tempfile
import urllib.request
from pathlib import Path
from html.parser import HTMLParser

SOURCE = 'https://jidelna.betlemska.cz/ejidelnicek/menu/'


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, value):
        self.parts.append(value)


def clean(value):
    parser = PlainText()
    parser.feed(str(value or ''))
    return re.sub(r'\s+', ' ', html.unescape(' '.join(parser.parts))).strip()


def extract(html_source):
    marker = re.search(r'\bejidelnicek\s*\.\s*setJidelnicek\s*\(\s*', html_source)
    if not marker:
        raise ValueError('Public page does not contain setJidelnicek JSON')
    raw, length = json.JSONDecoder().raw_decode(html_source[marker.end():])
    if not re.match(r'\s*\)', html_source[marker.end()+length:]):
        raise ValueError('Unexpected data following public JSON')
    if not isinstance(raw, dict) or not isinstance(raw.get('stravaMap'), dict):
        raise ValueError('Missing public stravaMap')
    lunches = [meal for meal in raw['stravaMap'].values()
               if isinstance(meal, dict) and (str(meal.get('id')) == '3' or clean(meal.get('nazev')).casefold() == 'oběd')]
    if len(lunches) != 1 or not isinstance(lunches[0].get('denMap'), dict):
        raise ValueError('Expected exactly one lunch denMap')
    days = {}
    for date, record in sorted(lunches[0]['denMap'].items()):
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date) or not isinstance(record, dict):
            continue
        dt.date.fromisoformat(date)
        source_menus = record.get('menuMap', {})
        if not isinstance(source_menus, dict):
            raise ValueError('Invalid menuMap on ' + date)
        menus = []
        for number in ('1', '2'):
            item = next((m for m in source_menus.values() if isinstance(m, dict) and str(m.get('dMenu')) == number), None)
            # If source omits dMenu, only accept numeric keys (never its dietary B menu).
            if item is None:
                candidate = source_menus.get(number)
                if isinstance(candidate, dict) and candidate.get('dMenu') in (None, '', number):
                    item = candidate
            if item and clean(item.get('nazev')):
                menus.append({'number': int(number), 'name': clean(item['nazev']), 'allergens': clean(item.get('alergZobr'))})
        soups = [{'name': clean(s['polevka']), 'allergens': clean(s.get('alergZobr'))}
                 for s in record.get('polevka', []) if isinstance(s, dict) and clean(s.get('polevka'))]
        # Source puts closure notices in polevka. Do not render those as edible soup.
        days[date] = {
            'date': date, 'label': clean(record.get('datumden')),
            'closed': not bool(menus),
            'message': ' · '.join(s['name'] for s in soups) if not menus else '',
            'soups': soups if menus else [], 'meals': menus,
            'drink': clean(record.get('napoj')), 'extra': clean(record.get('zakusek')),
        }
    if not days:
        raise ValueError('Public menu has no valid dates; keeping previous snapshot')
    return {'schemaVersion': 1, 'source': SOURCE, 'timezone': 'Europe/Prague',
            'fetchedAt': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'), 'days': days}


def download():
    # curl uses the runner's system TLS configuration; no CORS proxy or login.
    import subprocess
    result = subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error',
        '--proto', '=https', '--proto-redir', '=https', '--retry', '2', '--connect-timeout', '10',
        '--max-time', '30', '--max-filesize', '2000000', '--user-agent',
        'BetlemskaStudentPortal/1.0 (public menu reader)', SOURCE],
        capture_output=True, check=True, timeout=105)
    if len(result.stdout) > 2_000_000:
        raise ValueError('Public menu exceeds 2 MB')
    return result.stdout.decode('utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    snapshot = extract(args.input.read_text(encoding='utf-8') if args.input else download())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n'
    # Atomic write only after all validations pass; failed updates keep prior snapshot.
    descriptor, temporary = tempfile.mkstemp(prefix='.lunch-', dir=args.output.parent)
    try:
        with os.fdopen(descriptor, 'w', encoding='utf-8') as file:
            file.write(payload)
        os.replace(temporary, args.output)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print(f'Saved {len(snapshot["days"])} menu days to {args.output}')


if __name__ == '__main__':
    main()
