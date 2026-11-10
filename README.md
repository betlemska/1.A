# Betlémská · veřejná verze 2

Rozcestník 1.A na https://betlemska.github.io/1.A/.

Obsahuje aktuální veřejný obsah provozního rozcestníku, dělený rozvrh 1.A, zapsané změny výuky, písemky, školní akce, učitele, kabinetní kontakty, jídelnu, pravidla tělocviku, oblíbené a půdorysy. Mezi navazujícími hodinami přehled ukazuje Přestávka.

Oficiální školní zpráva má vlastní označení a odkaz přímo na článek školy. GitHub Actions obnovuje RSS a jídelníček přibližně každých deset minut během pracovního dne a jednou denně. Běhy se mohou zpozdit. Při výpadku zdroje se použije poslední ověřená kopie s datem zprávy nebo jídelníčku.

Redakční obsah se přenáší z provozního webu na pokyn správce. Plánované sestavení jej samo nepřepisuje. Správa otevírá provozní administraci, kde se spravují účty a jejich oprávnění. Upozornění push a hlášení chyb jsou dostupné na provozním webu. Samostatné GitHub Pages používá místní oblíbené, poznámky a offline úložiště pro tuto doménu.

## Sestavení a kontroly

Potřebuješ Python 3.12+, Node 24 a curl. Pro statickou verzi nejsou potřeba další balíčky.

```sh
python tools/update-lunch.py --output assets/lunch.json
python tools/update-school-news.py --output assets/school-news.json
python tools/prepare-pages.py
python tools/security-check.py --export _site
python -m unittest discover -s tests -p 'test_*.py'
node tests/static-export.cjs
node tests/offline.cjs
node tests/daily-tools.cjs
node tests/menu-parser.test.mjs
```

Výstup pro Pages vznikne v `_site/`. Data v `assets/content.json` pocházejí výhradně z veřejného rozhraní. Soukromé účty, hesla, přihlášení a koncepty se neexportují.

Po každém sestavení se změní otisk offline verze podle veřejných souborů a dat. Starší návštěvníci tak obdrží aktualizovaný rozcestník. Manifest a cesty podporují projektový adresář `/1.A/`.
