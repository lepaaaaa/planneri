# Planneri

Yhteinen Kanban-tyylinen Todo-sovellus tietokoneelle ja puhelimeen.

## Versio 2

Tässä versiossa on:

- muokattavat Kanban-sarakkeet
- sarakekohtainen värivalinta
- tehtävien lisääminen, muokkaaminen ja poistaminen
- poistamisen varmistus ennen tehtävän poistamista
- määräpäivä ja kuvaus tehtäville
- tehtävän siirtäminen alasvetovalikolla
- drag & drop -siirto tietokoneella
- Taulu-näkymä
- Kalenteri-näkymä
- Taulukko-näkymä
- taulukon nouseva/laskeva aikajärjestys
- taulukon ryhmittely sarakkeittain
- sarakkeiden värit kalenterissa ja taulukossa
- paikallinen tallennus selaimen `localStorage`-muistiin

## Rakenne

```text
planneri/
├── README.md
├── index.html
├── css/
│   └── style.css
└── js/
    └── app.js
```

## Päivitys GitHubiin

Korvaa nykyiset tiedostot:

- `index.html`
- `css/style.css`
- `js/app.js`

vanhojen tiedostojen tilalle.

GitHub Pages julkaisee uuden version automaattisesti, kun commit on tehty.

## Huomio tietojen tallennuksesta

Sovellus käyttää vielä `localStorage`-tallennusta, joten tiedot ovat laite- ja selainkohtaisia.

Versio 2 säilyttää saman tallennusavaimen (`planneri-demo-v1`) kuin ensimmäinen versio, joten jo lisäämäsi tehtävät pitäisi säilyä. Vanhoihin sarakkeisiin lisätään automaattisesti oletusväri ja vanhoihin tehtäviin tyhjä määräpäivä/kuvaus.

Seuraava suurempi vaihe on Supabase, jolloin tiedot synkronoituvat eri käyttäjien ja laitteiden välillä.


## Versio 3 – Supabase Auth

Tässä versiossa lisättiin:

- sähköposti + salasana -kirjautuminen
- uuden käyttäjän luominen
- Supabase-session tarkistus
- uloskirjautuminen
- sovelluksen piilottaminen kirjautumattomilta käyttäjiltä

Tehtävädata tallentuu vielä tässä vaiheessa selaimen `localStorage`-muistiin.
Seuraavassa vaiheessa `localStorage` korvataan Supabasen `boards`, `board_columns` ja `tasks` -tauluilla ja lisätään Realtime-synkronointi.

### Päivitys

Korvaa GitHubissa:

- `index.html`
- `css/style.css`
- `js/app.js`

Pidä nykyinen `js/supabase.js`, jossa ovat Project URL ja publishable key.
