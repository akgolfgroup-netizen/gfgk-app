import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

type Cat = 'medlemskap' | 'priser' | 'drift' | 'faq' | 'prosedyrer' | 'annet'
const ARTICLES: Array<{ slug: string; title: string; category: Cat; body: string }> = [
  {
    slug: 'prisliste-2026',
    title: 'Green fee 2026',
    category: 'priser',
    body: `## Green fee

| Type | Pris |
|---|---|
| Hverdag | 795 kr |
| Helg/helligdag · prime time (09:00–14:00) | 945 kr |
| Helg/helligdag · utenom prime (06:00–08:51 og 14:06–18:54) | 845 kr |
| Twilight (etter 19:00, alle dager) | 495 kr |

## Rabatter

- **Junior:** −300 kr på ordinær green fee (alle dager)
- **Gjest av medlem:** −20 % på ordinær green fee
- **Norsk Seniorgolf:** −25 % på hverdager før kl. 14:00 (fra 1. mai)

## Korthullsbanen (Flexi · Pay & Play)

- 18 hull: 300 kr
- 9 hull: 195 kr

> Priser kan endres ved sesongstart. Ved tvil — sjekk gfgk.no eller spør daglig leder.`,
  },
  {
    slug: 'medlemskap-priser',
    title: 'Medlemskap og priser',
    category: 'medlemskap',
    body: `## Fullt medlemskap (fri spill)

| Medlemskap | Pris/år | Inkluderer |
|---|---|---|
| Voksen (29+) | 8 950 kr | Spill på Huseby & Hankø og Hvaler |
| Fredrikstad Total (29+) | 11 950 kr | I tillegg Onsøy (alle fire klubber) |
| Ung voksen (20–28) | 4 950 kr | Samme klubbtilgang som voksen |
| Fredrikstad Total (20–28) | 7 950 kr | Alle fire klubber |
| Ungdom (13–19) | 2 750 kr | Onsøy på hverdager; helg kun Fredrikstad |
| Barn (5–12) | 1 150 kr | Som ungdom, redusert pris |

## Begrenset medlemskap

| Medlemskap | Pris/år | Vilkår |
|---|---|---|
| Greenfee-medlem | 5 250 kr | Betaler halv green fee av ordinær pris |
| Spillende medlem | 2 850 kr | Ordinær green fee |
| Støttemedlem | 300 kr | Ingen spillerett |

## Innmelding

Medlemmer melder seg inn via klubbens innmeldingsskjema på gfgk.no.
Betaling kan deles i inntil **10 avdrag** (30 kr fakturagebyr per faktura).`,
  },
  {
    slug: 'golfbil-og-tralle',
    title: 'Golfbil og tralle — leie',
    category: 'priser',
    body: `## Priser

| Leietaker | Pris |
|---|---|
| Medlem | 430 kr |
| Ikke-medlem | 530 kr |
| Med legeerklæring | 215 kr |

## Booking

- Bestilles via **EAGL-appen** eller **Golfbox** ved valg av starttid.
- **Legeerklæring:** book direkte hos servicepunktet — send e-post til servicepunkt@gfgk.no for personlig bookingkode.
- Bestill golfbilen **før starttiden** din, så det er tid til å komme til hull 1.

## Regler

- Minimumsalder: **18 år**.
- Det er **ikke tillatt** å kjøre i alkoholpåvirket tilstand.
- Bookingvindu: 06:00–20:00.`,
  },
  {
    slug: 'om-banen',
    title: 'Om banen',
    category: 'drift',
    body: `## Banen

- **Adresse:** Torsnesveien 16, 1630 Gamle Fredrikstad
- **Arkitekt:** Paal Midtvaage
- **Åpnet:** 2012
- **Type:** Linkspreget parkbane — strategisk design inspirert av skotske linksbaner. Vanskelige greenområder og mye vann; vinden påvirker spillet mye.
- Spilles for tiden med **sommergreener**.

## Anlegg

- **Driving range** med oppdatert betalingssystem
- **Korthullsbane** (Flexi Pay & Play)
- **Treningsområde**
- **Kiosk og toalett ved hull 8**

## Starttider

Starttider bestilles i **Golfbox**.`,
  },
  {
    slug: 'kontakt-og-servicepunkt',
    title: 'Kontakt og servicepunkt',
    category: 'drift',
    body: `## Kontakt

- **Adresse:** Torsnesveien 16, 1630 Gamle Fredrikstad
- **Administrasjon:** +47 406 97 598 · njo@gfgk.no
- **Servicepunkt:** +47 406 97 598 · servicepunkt@gfgk.no
- **Org.nr:** 996 123 715

## Servicepunktet

Sentralt plassert ved banen — kun få meter fra både første tee og driving range.

Servicepunktet tilbyr:
- **Utstyrssalg** fra Titleist, Ping, Cobra og Callaway (køller, baller, hansker, tilbehør)
- Informasjon om medlemskap, kurs og treningstilbud
- Info om aktiviteter, turneringer og sosiale arrangementer
- Hjelp for både nybegynnere og erfarne spillere

**Kiosk og toalett** finnes ved hull 8.`,
  },
]

async function main() {
  const admin = await sql`select id from users where role='admin' order by created_at limit 1`
  if (!admin[0]) throw new Error('Ingen admin-bruker funnet')
  const adminId = admin[0].id

  for (const a of ARTICLES) {
    await sql`insert into articles (slug, title, category, body, created_by)
      values (${a.slug}, ${a.title}, ${a.category}, ${a.body}, ${adminId})
      on conflict (slug) do update set
        title = ${a.title}, category = ${a.category}, body = ${a.body}, updated_at = now()`
    console.log(`✓ ${a.title} (${a.category}) — /kunnskap/${a.slug}`)
  }
  console.log(`\n${ARTICLES.length} artikler upsertet fra gfgk.no`)
}

main().catch((e) => { console.error(e); process.exit(1) })
