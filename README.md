# Betlémská - verze pro GitHub Pages

Připraveno 5. 11. 2026 ze současné zveřejněné verze a veřejného obsahu (revize 13).

## Rychlé spuštění

1. Založ na GitHubu veřejný repozitář s výchozí větví `main` (nebo `master`).
2. Rozbal tento ZIP a nahraj **jeho obsah**, ne celý ZIP ani nadřazenou složku. `index.html` musí být v kořeni. Důležité: nahraj i skrytou složku `.github/workflows/pages.yml` a soubor `.nojekyll`. Pro přenos celého adresáře je nejspolehlivější Git nebo GitHub Desktop.
3. V repozitáři otevři **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. V **Actions → Web a automatický jídelníček → Run workflow** spusť první publikování. Pokud už běh selhal před zapnutím Pages, spusť jej znovu.
5. Po zeleném dokončení najdeš skutečnou adresu v **Settings → Pages**. Ověř na webu datum jídelníčku a tlačítko Objednat si.

Žádná databáze, server, vlastní API klíče ani dodatečný hosting nejsou potřeba. Pro veřejný repozitář lze použít GitHub Free; platí běžné limity a podmínky GitHub Pages a Actions. Naše první skutečné nasazení na GitHub ani běh jejich plánovače ještě nebyly provedeny.

## Jak se aktualizuje jídelníček

GitHub Actions stáhne HTML z https://jidelna.betlemska.cz/ejidelnicek/menu/, přečte vložený JSON setJidelnicek a vytvoří assets/lunch.json. JavaScript jídelny se nespouští; nevyžaduje přihlášení ani cizí proxy. Aktualizovaný web se rovnou zveřejní.

- Každých deset minut v pracovní dny: **04:07 až 15:57 UTC**. V zimě 05:07–16:57 v Praze, v létě 06:07–17:57.
- Navíc denně v **03:17 UTC** (04:17 v zimě, 05:17 v létě v Praze).
- Také po změnách souborů na main/master a při ručním Run workflow.

Interval je plán, nikoli garance doručení do deseti minut. GitHub může běhy zpozdit či přeskočit. Po 60 dnech bez aktivity veřejného repozitáře může plán vypnout; znovu ho zapni v Actions. Proto nelze slíbit naprosto stejnou čerstvost jako původní serverová verze.

Web stále vybírá přesně dnešní datum v Europe/Prague a ukazuje polévku, dvě standardní jídla, alergeny i Objednat si. Tlačítko **Obnovit** načte poslední již zveřejněný soubor, nespustí GitHub Actions. Každý úspěšný běh připraví i vloženou kopii pro offline zobrazení.

Při výpadku se nejprve zkusí zachovat poslední platná nabídka z předchozího GitHub Pages nasazení. Je-li nedostupná i ta, zůstane kopie přiložená v repozitáři. Zdroj se nikdy nepřepisuje neplatnou odpovědí. Včerejší jídlo se nevydává za dnešní; chybějící dnešní datum zobrazí odkaz do oficiální jídelny. Čas posledního načtení je vždy vidět.

## Co zůstalo a co bylo odstraněno

Zůstaly všechny dodané profily, portréty a sociální odkazy, rozvrh 1.A, dostupnost dle rozvrhu, kalendář včetně nyní zapsané písemky, svátky a animované přání, půdorysy, dokumenty, video, vyhledávání, oblíbení, přidání na plochu a základní offline režim. Jde o neoficiální rozcestník; skutečná docházka a suplování nejsou připojené.

Odstraněna byla správa, přihlašování, formulář hodnocení a poznámek, hlášení chyb a push notifikace. Aktuality a písemky jsou zachované jako soubory, nové změny se provádějí jejich úpravou a publikováním. Vlastní půdorysy a oblíbené jsou pouze místní funkce, které nepotřebují server.

Nová doména má vlastní úložiště prohlížeče: původní oblíbené, lokální plány a instalace z chatgpt.site se automaticky nepřenesou. Web si na telefon přidej z nové adresy znovu. Sdílení nyní používá skutečnou adresu právě otevřeného webu.

## Úpravy obsahu bez redakce

- `assets/content.json`: zachycený veřejný obsah, hlavně `content.teachers`, `content.exams`, `content.posts`, `content.settings` a `content.events`.
- `assets/data.json`: základní školní podklady; seznam v content.teachers má přednost, je-li vyplněný.
- `assets/`: portréty, video, PDF a ostatní soubory.

Po změnách spusť `python tools/prepare-pages.py`, pokud chceš zkoušet soubor lokálně. GitHub workflow to provádí automaticky. Pro ruční aktualizaci nabídky spusť `python tools/update-lunch.py --output assets/lunch.json` a potom prepare-pages. Potřebuješ Python 3.12+, curl a pro testy Node 24. Žádné balíčky přes pip/npm nejsou nutné.

Pro lokální prohlížečový náhled: `python -m http.server 8000 --directory _site`. Otevření index.html přímo funguje s vloženými daty, ale instalace a aktualizace vyžadují HTTPS hosting.

## Ověření

`python -m unittest discover -s tests -p 'test_*.py'`
`node tests/static-export.cjs`
`node tests/offline.cjs`
`node tests/daily-tools.cjs`
`node tests/menu-parser.test.mjs`

Kontroly zahrnují rozběh sedmi sekcí i bez sítě, zachování současného obsahu a písemky, odstranění serverových volání, cesty pro GitHub projektové adresáře, instalaci offline souborů a chování při výpadku jídelny. Automatické kontroly doplnila vizuální kontrola v prohlížeči; nejde o zkoušku skutečného GitHub nasazení ani fyzického telefonu.

## Dokumentace

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

Původní živý web zůstává tímto exportem beze změny. Stěhování ještě nebylo provedeno.
