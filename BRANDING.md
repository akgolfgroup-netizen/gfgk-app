# GFGK — Branding & Design System

**Versjon:** 1.0
**Mål:** Notion-inspirert produktivitetsverktøy med GFGK-identitet. Beta er kun mobil — også for admin.
**Filosofi:** Minimalistisk, produktivt, varmt. Alle ansatte (admin og ansatt) jobber i lommen.

---

## 1. Brand Essence

GFGK står for Gamle Fredrikstad Golfklubb. Festningssoldat-symbolet refererer til Fredrikstad Festning som klubben ligger ved. Identiteten skal kjennes ut som:

- **Stolt** — tradisjon, lokalhistorie, ekte
- **Strukturert** — alt på plass, ingen friksjon
- **Varmt** — cream-bakgrunn, ikke kald hvit; mennesker, ikke skjemaer

Appen er ikke en marketing-side. Den er klubbens digitale arbeidsbenk. Tonen skal være som en kollega som har orden i sysakene — ikke en glanset SaaS-onboarding.

---

## 2. Logo

**Primær:** Festningssoldat i gull (#F5C518) på sort (#0A0A0A) bakgrunn.
**Alternativ:** Festningssoldat i sort på cream (#FAF7EE).
**Wordmark:** "GFGK" i Inter ExtraBold (800), letter-spacing tight.

| Plassering | Størrelse | Eksempel |
|---|---|---|
| Splash / login | 160 × 160 px | sentrert, gull glow `drop-shadow(0 4px 24px rgba(245,197,24,.25))` |
| Header (alle sider) | 28 × 28 px | venstre i sort header |
| App-ikon (PWA) | 512 × 512 px | gull soldat på sort, avrundet maske |
| Favicon | 32 × 32 px | forenklet soldatkonturer i gull |

**Clear space:** Minimum 1 × logohøyde i alle retninger.
**Forbudt:** Strekk, vri, fargefilter, plassering på bilde uten kontrastlag.
**Filplassering:** `/public/logo.png` (primær), `/public/logo-mono.svg` (alternativ).

---

## 3. Fargepalett

Notion-inspirert ro med GFGK-aksenter. Cream som hovedbakgrunn (ikke ren hvit) gir lavt visuelt støynivå over lang skjermtid.

### Primær (handling, fremhevning)
| Token | Hex | Bruk |
|---|---|---|
| `gold` | `#F5C518` | Primær CTA, aktiv tab, fokus-ring, fremhevde streker |
| `gold-deep` | `#D9A800` | Hover/active på gull, headinger over gull-fyll |
| `gold-light` | `#FFF4D6` | Bakgrunn for fremhevd kort, status "aktiv" pill |

### Nøytral lys (Notion-base)
| Token | Hex | Bruk |
|---|---|---|
| `cream` | `#FAF7EE` | Global sidebakgrunn |
| `cream-deep` | `#F2EDE0` | Sekundær bakgrunn (hover, valgte rader, chip-bakgrunn) |
| `white` | `#FFFFFF` | Kort, paneler, input-felt |
| `border` | `#E5E0D6` | Subtile linjer (kort, divider) |
| `border-strong` | `#C9C2B3` | Input-felt, knapp-outline |

### Nøytral mørk (kontrast)
| Token | Hex | Bruk |
|---|---|---|
| `black` | `#0A0A0A` | Header, bottom-nav, primær tekst på lys |
| `charcoal` | `#1F1F1F` | Sekundær mørk (bottom-nav-bakgrunn 95% opacity) |

### Aksent
| Token | Hex | Bruk |
|---|---|---|
| `red` / `red-deep` / `red-light` | `#E94B3C` / `#C43A2C` / `#FCE9E5` | Destruktiv handling, varsel, utgift, forfalt |
| `teal` / `teal-deep` / `teal-light` | `#2BA8B0` / `#1F8089` / `#DCF1F2` | Suksess, inntekt, fullført, AI-respons |

### Tekst
| Token | Hex | Bruk |
|---|---|---|
| `text` | `#1B1B1B` | Primær (titler, kropp) |
| `text-2` | `#5A5A5A` | Sekundær (meta, labels) |
| `text-3` | `#9C9C9C` | Tertiær (placeholders, disabled) |

---

## 4. Typografi

**Familie:** Inter (400, 500, 600, 700, 800, 900) via Google Fonts.
**Hierarki:**

| Rolle | Størrelse | Vekt | Tracking | Linjehøyde |
|---|---|---|---|---|
| Display (splash) | 32 px | 800 | -0.02em | 1.1 |
| H1 (page title) | 24 px | 800 | -0.01em | 1.2 |
| H2 (section) | 18 px | 700 | 0 | 1.3 |
| H3 (block) | 16 px | 700 | 0 | 1.4 |
| Body | 15 px | 400 | 0 | 1.5 |
| Body bold | 15 px | 600 | 0 | 1.5 |
| Small | 13 px | 500 | 0 | 1.4 |
| Meta / caption | 11 px | 600 | uppercase, 0.12em | 1.3 |

**Section-label-mønster:** `text-[10px] font-extrabold uppercase tracking-widest text-gold-deep` med en kort gull-vertikal-strek (3.5 × 0.5 px) som prefiks.

---

## 5. Spacing & layout

**Mobil-first lock for beta:** All layout har `max-w-[480px] mx-auto`. Desktop får sentrert mobilvisning — vi designer ikke for desktop i M1.

**Spacing-skala (4-base):**
`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`

**Horisontal padding:** 24 px utenfor kort, 16 px inne i kort.
**Vertikal seksjonsavstand:** 32 px.
**Safe area:** `pt-safe` på header, `pb-safe` på bottom-nav.

**Standard sidestruktur:**
```
[Sort header — pt-safe, pb-6, px-6]
  - Tilbake-link (white/50, 13 px)
  - H1 (gold)
  - Subtittel (white/50, 13 px) ELLER actions-rad

[Cream body — pt-6, pb-24, px-6]
  - Section 1 (label + innhold)
  - Section 2
  - ...

[Bottom-nav — fixed, pb-safe]
```

**Bottom-nav-høyde:** 56 px + safe-bottom.
**Header-høyde:** 88 px + safe-top.
**FAB (floating action button):** 56 × 56 px, plassert `bottom-20 right-6` (over bottom-nav).

---

## 6. Notion-inspirerte mønstre

Det som gjør Notion produktiv:

1. **"Alt er en side."** Ingen modaler unntatt destruktive bekreftelser. Klikk på et kort = naviger til sin egen side.
2. **Inline-redigering.** Tittel og beskrivelse er redigerbare felter direkte i visning. Blur lagrer.
3. **Blocks.** Hver oppgave/seksjon er en "block" som kan kopieres, slettes, drasses.
4. **Toggle-foldere.** Pil-ikon foran seksjoner som kan kollapses.
5. **Slash-meny.** (M2 — ikke beta.) `/` åpner meny for å sette inn ny block-type.
6. **Drag-and-drop.** Drag-håndtak (6-dot pattern) til venstre for hver block.
7. **Empty states som invitasjoner.** "Ingen oppgaver enda. Tap + for å lage den første."
8. **Bunn-sheet over modal.** Action-menyer og pickere kommer fra bunnen, ikke fra senter.

**Hva vi IKKE adopterer fra Notion:**
- Multi-pane-layouts (vi er mobil)
- Hvit bakgrunn (vi bruker cream)
- Generisk sans-serif (vi bruker Inter med GFGK-rytme)

---

## 7. Komponentbibliotek

### 7.1 Page Header
- Sort bakgrunn, `pt-safe pb-6 px-6`
- Tilbake-link `← [forrige side]` i white/50, 13 px, hover white/80
- H1 i gold, 24 px / 800, tracking-tight
- Undertittel i white/50, 13 px
- Optional høyre-action: ikon-knapp 40 × 40 px (filter, settings)

### 7.2 Section Label
- 14 × 2 px gull-strek + 10 px uppercase tracking-widest tekst i gold-deep
- 12 px margin-bottom før innhold

### 7.3 Card / Page Block
- Hvit bakgrunn, border 1 px `border`, radius 12 px, padding 16 px
- Skygge: `0 1px 2px rgba(0,0,0,.06)`
- Optional venstre-aksent 4 px gull (for fremhevde/aktive)
- Hover: bakgrunn `cream-deep` (kun trykkbare)

### 7.4 Two-tone Card
- Sort topp (px-4 py-2.5) m/ 10 px uppercase tittel i gold
- Hvit body (px-4 py-3)
- `overflow-hidden`, radius 12 px
- Brukes til: admin-meny-elementer, lønnssammendrag, prosjekt-headere

### 7.5 Task Block (Notion-stil)
```
[⋮⋮]  [○] Tittelen på oppgaven                    [pill]
       Dato · Tildelt · Prioritet
```
- 32 px høyde minimum, 12 px padding
- Drag-håndtak (6-dot grid) i text-3, vises ved hover/lang-trykk
- Checkbox sirkel 20 × 20 px, border-strong når tom, gull fyll + sort hake når aktiv
- Tittel inline-redigerbar (tap → tekstfelt)
- Meta-linje under: 12 px text-2, separert med `·`
- Status-pill ytterst til høyre
- Tap hvor som helst (utenom drag/check) = åpne detalj-side

### 7.6 Project Card
- Two-tone variant: sort topp m/ prosjekt-navn + status-pill
- Hvit body med:
  - Progress-bar (gull fyll, 4 px høyde) + "3 av 8 oppgaver"
  - Deadline (rød hvis forfalt, ellers text-2)
  - Avatar-stack (medlemmer)
- Tap = åpne prosjekt-side

### 7.7 Status Pill
- Høyde 24 px, padding 4 × 10 px, radius full, 11 px font-semibold uppercase
- Varianter:
  - `aktiv`: gold-light bg / gold-deep tekst
  - `fullført`: teal-light bg / teal-deep tekst
  - `pause`: cream-deep bg / text-2
  - `forfalt`: red-light bg / red-deep tekst

### 7.8 Priority Tag
- Høyde 18 px, mini-pill, 10 px font-bold
- Høy: red-light / red-deep
- Middels: gold-light / gold-deep
- Lav: teal-light / teal-deep

### 7.9 Avatar
- Sirkel — sm 24, md 32, lg 40, xl 56 px
- Initialer på `cream-deep` bg, text farge
- Bilde hvis tilgjengelig, ellers initialer
- Border 2 px hvit når i avatar-stack

### 7.10 Avatar Stack
- Inntil 4 avatarer, offset -8 px
- "+N" pill etter siste hvis flere

### 7.11 Knapper

| Variant | Bakgrunn | Tekst | Border | Bruk |
|---|---|---|---|---|
| Primær | `gold` | `black` | — | Hovedhandling per side |
| Sekundær | `white` | `text` | 2 px `black` | Avbryt, alternativ |
| Destruktiv | `red-light` | `red-deep` | — | Slett, trekk tilbake |
| Ghost | transparent | `text-2` | — | Filtre, meta-handlinger |

**Størrelser:** sm (32 h), md (40 h), lg (48 h), xl (56 h — FAB).
**Radius:** 8 px (md/lg), 12 px (xl/FAB), full (FAB ikon-knapp).
**Font:** 14 px font-bold (primær), 13 px font-semibold (sekundær).
**Disabled:** `cream-deep` bg, `text-3` tekst, `cursor-not-allowed`.

### 7.12 FAB (Floating Action Button)
- 56 × 56 px sirkel, gull bakgrunn, sort Lucide-ikon (Plus, 24 px)
- Plassering: `fixed bottom-20 right-6` (over bottom-nav)
- Skygge: `0 4px 12px rgba(245,197,24,.4)`
- Trykk-animasjon: `scale(0.95)`

### 7.13 Input
- Hvit bg, border 1 px `border-strong`, radius 12 px, padding 12 × 16 px
- Font 15 px, tekstfarge `text`
- Focus: `gold` border + `gold/30` ring (2 px)
- Placeholder: `text-3`
- Disabled: `cream` bg, `text-3` tekst
- Label: 13 px font-semibold over feltet, 6 px gap
- Helper-tekst: 12 px `text-2` under
- Error: `red-deep` tekst + `red` border

### 7.14 Select
- Som input + custom chevron-SVG (text-2) i høyre kant

### 7.15 Checkbox / Toggle
- Task-checkbox: 20 × 20 px rund, beskrevet i 7.5
- Square checkbox (filter/settings): 18 × 18 px, radius 4, gull fyll når aktiv
- iOS-stil toggle: 44 × 26 px, gull når på

### 7.16 Toggle (Notion fold)
- Chevron-right 16 px, roterer 90° når åpen
- Tap på hele rad-overskriften = fold/utfold
- Animasjon 150 ms ease-out

### 7.17 Bottom Nav
- 4 base + (admin → 5) tabs
- Bakgrunn `charcoal/95` med backdrop-blur
- Topp-border 2 px gull
- Maks bredde 480 px sentrert
- Per tab: Lucide-ikon 24 px + label 11 px font-semibold
- Aktiv: gull farge + 4 × 2 px gull-strek under label
- Inaktiv: white/60, hover white

**Tabs (rolle):**
- Ansatt: Hjem, Oppgaver, Kalender, Profil
- Admin: + Admin (egen tab som åpner admin-meny)

### 7.18 Tab Bar (intern)
- Horisontal scroll, transparent bg
- Aktiv: 14 px font-semibold `text`, 2 px gull underline (4 px gap)
- Inaktiv: 14 px font-medium `text-2`
- Gap mellom tabs: 24 px

### 7.19 Filter Chip
- Høyde 32 px, padding 6 × 12 px, radius full
- Inaktiv: `cream-deep` bg, `text` tekst
- Aktiv: `gold` bg, `black` tekst
- 13 px font-semibold
- Siste chip: "+ Legg til" (ghost, border dashed)

### 7.20 Bottom Sheet
- Sklir opp fra bunn, radius 16 px topp
- Drag-handle: 32 × 4 px `text-3` sentrert øverst, 8 px margin
- Maks høyde 80 vh
- Backdrop: `black/40`, tap = lukk
- Bruk for: handlinger, datepicker, person-velger, attachment-meny

### 7.21 Dialog (kun bekreftelser)
- Sentrert, maks 320 px bred
- Hvit bg, radius 16 px, padding 24 px
- Tittel 18 px / 700
- Beskrivelse 14 px `text-2`
- Knapp-rad: Avbryt (sekundær, venstre) + Bekreft (destruktiv, høyre)
- Brukt i `ConfirmButton`-komponenten

### 7.22 Toast / Snackbar
- Bunn, over bottom-nav, sentrert, maks 360 px
- Radius 8 px, padding 12 × 16 px, 14 px font-medium
- Suksess: teal bg, hvit tekst
- Feil: red bg, hvit tekst
- Info: black bg, hvit tekst
- Auto-dismiss 4 s, swipe-to-dismiss

### 7.23 Calendar — Måned
- Header: "Oktober 2026" + venstre/høyre-piler + "I dag"-link
- 7-kol grid, ukenavn øverst (man-søn, 11 px text-3)
- Dag-celle 36 × 36 px, font 13 px
- Indikator under dag-tall: 4 px gull prikk hvis events
- I dag: sort fylt sirkel, hvit tall
- Valgt: gull fylt sirkel, sort tall
- Under grid: events for valgt dag (liste med Shift Block / Activity Block)

### 7.24 Calendar — Uke
- Header med 7 dager horisontalt + dato
- Vertikal timeline 7:00–22:00, hver time 48 px høyde
- Events som farge-blokker (gull = vakt, teal = aktivitet, red = ferie)

### 7.25 Calendar — Dag (agenda)
- Vertikal liste, time-grupper
- Hvert event som Two-tone Card med tid + tittel + tildelt

### 7.26 Calendar — År
- 12 mini-mnd-grids (3 kol × 4 rad), 11 px font
- Tap på en mnd = naviger til måned-view

### 7.27 Shift Block (vaktliste)
- Venstre-aksent 4 px (gull = vakt, red = ferie, teal = bytte-forespørsel)
- Hvit bg, radius 12 px, padding 12 × 16 px
- Linje 1: tid `08:00–14:00` (15 px font-bold)
- Linje 2: ansatt-navn (13 px `text-2`)
- Linje 3 (optional): note (12 px `text-3`)

### 7.28 Activity / Event Block
- Som Shift Block, men teal aksent
- "AK Golf — Juniorturnering" + sted

### 7.29 Knowledge Article Card
- Hvit bg, radius 12, padding 16
- Tittel 16 px / 700, 2-linje truncate
- Excerpt 13 px `text-2`, 2-linje truncate
- Meta-rad: kategori-chip + "Oppdatert i går" (11 px `text-3`)

### 7.30 Article Page (kunnskap-detalj)
- Cream bg, ingen sort header (gir lesefokus)
- Tittel 28 px / 800
- Meta: forfatter + dato (13 px `text-2`)
- Markdown-innhold med:
  - H2: 20 px / 700, 32 px top-margin
  - H3: 17 px / 700, 24 px top-margin
  - Body: 16 px, 1.6 line-height
  - Code-block: cream-deep bg, mono font, 14 px
  - Quote: 4 px gull venstre-border, 16 px padding-left
- Admin: rediger-FAB nede til høyre

### 7.31 AI Inbox Item
- Hvit bg, venstre-aksent 4 px (gull = ny, teal = AI-utkast klart, text-3 = sendt)
- Linje 1: avsender + tid
- Linje 2: emne (font-bold)
- Linje 3: AI-status: "Foreslått svar klart" med gull pill
- Tap = åpne tråd-side

### 7.32 AI Reply Composer
- Original melding-quote øverst (4 px gull venstre-border, cream-deep bg)
- AI-utkast i editerbart textarea (hvit, gull focus)
- Knapper: "Send" (primær), "Skriv om" (sekundær, åpner ny AI-prompt), "Skriv selv" (clear + skriv fra null)

### 7.33 Empty State
- 48 × 48 px Lucide-ikon i gull, sentrert
- Tittel 16 px / 700 `text`
- Beskrivelse 13 px `text-2`, maks 240 px bred
- CTA-knapp primær eller sekundær

### 7.34 Skeleton Loader (i stedet for spinner)
- Bruk `cream-deep` bg + pulse-animasjon
- Match faktisk innhold-struktur (rad-høyde, bredde, antall)
- Brukes på alle lister mens data laster

### 7.35 Spinner (kun for korte handlinger)
- 24 px sirkel, gull stroke, 2 px tykk, 800 ms rotasjon
- Bruk inne i knapper under submit

---

## 8. Ikoner

**Bibliotek:** Lucide React.
**Standardstørrelse:** 24 px i nav/header, 20 px i lister, 16 px i pills.
**Stroke:** 2 px.
**Farge:** `text-2` inaktiv, `text` aktiv på lys bg, `gold` aktiv på sort bg.
**ALDRI emojis.** Per CLAUDE.md.

**Vanlige ikoner:**
- `Home` — Hjem
- `CheckSquare` — Oppgaver
- `Calendar` — Kalender
- `BookOpen` — Kunnskap
- `User` — Profil
- `Settings` — Admin
- `Plus` — FAB / legg til
- `MoreVertical` — Meny / actions
- `ChevronRight` — Naviger
- `ChevronDown` — Fold ut
- `GripVertical` — Drag-håndtak
- `Bell` — Varsler
- `Inbox` — AI-meldinger
- `Paperclip` — Vedlegg
- `Image`, `Video` — Media
- `Search` — Søk
- `Filter` — Filter
- `Trash2` — Slett
- `Edit3` — Rediger
- `Check` — Bekreft / fullført
- `X` — Lukk / avbryt

---

## 9. Mobilskjermer (alle 360 × 800 px referanse)

### 9.1 Splash / Loading
- Sort bg
- Festningssoldat-logo 120 px sentrert vertikalt
- Gull halo
- "GFGK" wordmark under, 32 px / 800

### 9.2 Login
- Sort header (pt-safe, pb-12), logo 60 px + "GFGK" 18 px
- Cream body
- H1 "Logg inn", undertittel "GFGK Servicepunkt"
- Input "E-post"
- Input "Passord" (med øye-toggle)
- Primær-knapp "Logg inn" full bredde
- Ghost-link "Glemt passord?" sentrert
- (Ingen "registrer" — kun via invitasjon)

### 9.3 Dashboard / Hjem
- Header: "Hei, Anders"
- Section "I dag": shift-blocks (egne vakter) + aktivitets-blocks
- Section "Oppgaver": top 3 oppgaver, "Se alle →" lenke
- Section "AI-meldinger" (kun admin): "3 nye meldinger venter på svar"
- Section "Denne uken": kommende dager med antall vakter/oppgaver

### 9.4 Oppgaver — Liste
- Header: "Oppgaver" + filter-ikon
- Filter-chips horisontalt: "Alle / Mine / I dag / Forfalt / Fullført"
- Liste med Task Blocks gruppert under section-labels ("I dag", "I morgen", "Senere")
- FAB (Plus) for ny oppgave

### 9.5 Oppgaver — Detalj
- Header: "← Oppgaver" + MoreVertical
- Tittel inline-editable (24 px / 800)
- Meta-grid:
  - Status (pill, tap = bottom-sheet velger)
  - Prioritet (pill)
  - Tildelt (avatar-stack, tap = velger)
  - Frist (dato, tap = datepicker)
  - Tid (start–slutt, tap = tidspicker)
- Section "Beskrivelse" (markdown, inline-edit)
- Section "Vedlegg" (grid 3-kol med thumbnails, + tap = bottom-sheet kamera/galleri/fil)
- Section "Underoppgaver" (nested Task Blocks med "+"-knapp)
- Section "Kommentarer" (chat-stil)
- Bunn: rediger-actions skjult i MoreVertical

### 9.6 Prosjekter — Liste
- Header: "Prosjekter"
- Tab-bar: "Mine / Alle / Arkiv"
- Liste med Project Cards
- FAB

### 9.7 Prosjekter — Detalj
- Header: prosjekt-navn + status-pill
- Beskrivelse (foldbar)
- Tab-bar: "Oppgaver / Kalender / Filer / Medlemmer"
- Innhold-tab vises (default Oppgaver — samme komponent som 9.4)

### 9.8 Kalender — Måned (default)
- Header: "Oktober 2026" + venstre/høyre-piler
- View-toggle øverst: "Dag / Uke / Måned / År" (segmented control)
- Mnd-grid
- Under: liste med events for valgt dag
- FAB (kun admin): "+ Ny aktivitet"

### 9.9 Kalender — Uke
- Som 9.8 men 7-dagers timeline
- Pinch-to-zoom på time-høyde

### 9.10 Kalender — Dag
- Agenda-liste med tidsgrupper
- "Nå"-linje (gull horisontal strek på current time)

### 9.11 Kalender — År
- 12 mini-grids, tap = naviger til måned

### 9.12 Kunnskap — Liste
- Header: "Kunnskap" + søk-ikon
- Søkefelt (sticky når scroll)
- Kategori-chips: "Alle / Medlemskap / Drift / FAQ / Prosedyrer"
- Liste med Knowledge Article Cards
- FAB (kun admin)

### 9.13 Kunnskap — Artikkel
- Som beskrevet i 7.30
- Admin FAB: "Rediger"

### 9.14 Vaktliste — Liste
- Header: "Vakter"
- View-toggle: "Dag / Uke / Måned / År"
- Innhold avhenger av view (som 9.8–9.11 men med Shift Blocks)
- Admin FAB: bottom-sheet velger:
  - "Generer for X uker frem"
  - "Legg til vakt manuelt"

### 9.15 Vaktliste — Generator (admin)
- Header: "Generer vakter"
- Datointervall (fra/til pickers)
- Liste over ansatte med:
  - Avatar + navn
  - Stillingsprosent
  - Foretrukne vakter (chips)
  - Toggle: "Inkluder i generering"
- Knapp "Generer forslag"
- Etter generering: forhåndsvisning + "Publiser alle" / "Endre"

### 9.16 Min Profil
- Header: "Profil"
- Avatar (tap = endre)
- Navn (inline-edit)
- E-post (read-only)
- Telefon
- Section "Arbeid":
  - Stillingsprosent
  - Timer per uke
  - Foretrukne vakttider (chips: morgen/ettermiddag/kveld)
- Section "Ferie":
  - Kommende ferieperioder
  - "+ Søk om ferie"
- Logg ut (sekundær knapp nede)

### 9.17 Admin — Hub
- Header: "Admin"
- Two-tone cards i grid:
  - Ansatte
  - Vaktliste (generator)
  - Budsjett
  - Lønn
  - Rapporter
  - Prosjekter
  - Inbox (AI-meldinger)
  - Kunnskap
  - Kalender (aktiviteter)
  - Innstillinger

### 9.18 Admin — Ansatte
- Header: "Ansatte"
- Tab-bar: "Aktive / Invitasjoner"
- Liste med ansatte (Card med avatar + navn + rolle-pill)
- FAB: "+ Inviter"

### 9.19 Admin — Ansatt-detalj
- Header: ansatt-navn + MoreVertical (slett, deaktiver)
- Alle felter fra Min Profil + redigerbar rolle og timesats

### 9.20 Admin — AI Inbox
- Header: "Inbox" + filter
- Filter-chips: "Alle / Nye / Utkast klart / Sendt / Manuell"
- Liste med AI Inbox Items
- Bunn-statistikk: "12 i dag · AI besvarte 8"

### 9.21 Admin — AI-meldingstråd
- Header: avsender-navn + emne
- Tråd-historikk (chat-stil bobler)
- AI Reply Composer nederst (sticky)

### 9.22 Admin — Innstillinger
- Sections:
  - "AI-svar-maler" (skills som agenten bruker)
  - "E-post" (servicepunkt@gfgk.no-konfig)
  - "Budsjett-kategorier"
  - "Vakttype-maler" (morgen/ettermiddag/kveld)
  - "Importer aktiviteter" (AK Golf-synk)

---

## 10. Interaksjonsmønstre

| Mønster | Detalj |
|---|---|
| Trykk-respons | 100 ms `scale(0.97)` på all aktiv UI |
| Side-sveip | iOS-stil sveip-fra-venstre-kant = tilbake |
| Pull-to-refresh | Alle lister; spinner i gull |
| Long-press | Block-handlinger (kopier, slett, flytt) i bottom-sheet |
| Drag-and-drop | Drag-håndtak (GripVertical) til venstre — re-order + status |
| Inline-edit | Tap tekst = bli til input, blur lagrer, ESC avbryter |
| Bottom-sheet | All sekundær-handling — aldri sentrer-modal unntatt destruktive |
| Skjelett-laster | Match-struktur for lister (ikke spinner) |
| Toast | Suksess/feil-bekreftelser; auto-dismiss 4 s |
| Tom tilstand | Alltid en CTA — aldri en dead-end |
| Offline | Kalender + vaktliste cached; banner "Du er offline" når aktivt |

---

## 11. Tone of voice

**Språk:** Norsk bokmål gjennom hele appen.

**Prinsipper:**
- Direkte: "3 oppgaver venter" (ikke "Du har 3 oppgaver som venter på din oppmerksomhet")
- Varm: "Velkommen tilbake, Anders" (ikke "Bruker autentisert")
- Konkret: "Slette denne oppgaven?" (ikke "Bekreft handling")
- Hjelpsom i tomme tilstander: "Ingen oppgaver enda. Tap + for å lage den første."
- Ærlig i feil: "Klarte ikke å koble til. Sjekk nettverket og prøv igjen."

**AI-stemmen (servicepunkt-bot):**
- Profesjonell, kort, signert med "Servicepunkt · GFGK"
- Aldri "Hei!" med utropstegn
- Aldri "selvsagt", "absolutt", "selvfølgelig"
- Bruker spørsmål når noe er uklart, ikke gjetting

**Forbudt:**
- Emojis (overalt)
- Marketing-fluff ("Klar til å revolusjonere?")
- Engelsk lingo ("Cool!", "OK!", "Awesome!")
- Utropstegn (bortsett fra vakter med endring eller alvorlige varsler)

---

## 12. Tilgjengelighet

**Minimum:**
- Kontrast WCAG AA på all tekst (cream/text gir 12:1, gold/black gir 11:1)
- Trykk-mål 44 × 44 px minimum (Apple HIG)
- Fokus-ring synlig på tastatur-nav (gull 2 px outline)
- Skjermleser-labels på alle ikon-knapper (`aria-label`)
- Reduced motion: respekt `prefers-reduced-motion` (ingen scale, fade i stedet)

**Tekststørrelse:**
- Skal være lesbar ved Dynamic Type opp til 130 %
- Bruk `text-base` (15 px) som minimum body-størrelse, aldri under 13 px

---

## 13. Mørk modus

**M1 / beta:** Kun lys (cream-base).
**M2 / senere:** Mørk modus med:
- Bakgrunn `black` / `charcoal`
- Kort `#1a1a1a`
- Tekst `cream` / `cream-deep`
- Gull og aksent-farger uendret
- Logo: gull-på-sort (allerede dark-vennlig)

---

## 14. Tekniske notater

**Stack:** Next.js 16 App Router + React 19 + Tailwind v3 + shadcn/ui + Drizzle + Neon + Auth.js v5 + Vercel Blob (attachments).

**Komponent-organisering:**
- `src/components/ui/` — atomer (Button, Input, Avatar, Pill, etc.)
- `src/components/blocks/` — molekyler (TaskBlock, ShiftBlock, ArticleCard, etc.)
- `src/components/layout/` — sider-skall (PageHeader, BottomNav, FAB, etc.)

**Tailwind-konvensjoner:**
- Bruk `gfgk-*` tokens definert i `tailwind.config.ts`
- Aldri inline hex-koder utenfor config-filen
- `clsx` / `cn`-helper for betinget className

**Tilstand & data:**
- Server Components default
- Server actions for alle mutasjoner
- React Query / SWR kun hvis vi får behov for klient-side polling (foreløpig ikke)

---

## 15. Roadmap-status

- [x] M1: Auth, roller, brukerliste
- [x] M2: Invite flow
- [x] M3: Vaktliste basic
- [x] M4: Budsjett basic
- [x] M5: Profil, timer, lønn, rapporter, prosjekter
- [x] M6: E-post, kalender basic, CSV-eksport
- [ ] M7: Notion-stil oppgavemodul + bilder/video
- [ ] M8: Kalender 2.0 (dag/uke/måned/år + AK Golf-synk)
- [ ] M9: Kunnskapsbank
- [ ] M10: Vaktliste 2.0 (auto-generator + ferie)
- [ ] M11: AI Inbox (servicepunkt@gfgk.no)
- [ ] M12: PWA + push-varsler
- [ ] M13: Tester + CI

---

**Sist oppdatert:** 2026-05-27
**Eier:** Anders Kristiansen / AK Golf Group
