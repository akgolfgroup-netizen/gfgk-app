# Plan: Adoptere AK Golf HQ-designsystemet, re-brandet til GFGK

## Context
gfgk-app (Next.js PWA for Gamle Fredrikstad Golfklubb — vakter, sjekklister, oppgaver, budsjett, kunnskap) har et reint, men «kjedelig» uttrykk. Anders har levert et modent designsystem fra et annet prosjekt — **AK Golf HQ** («editorial sport-analytics»: DataGolf møter The Athletic på Linear). Vi bruker AK HQ som **strukturelt utgangspunkt** (tokens, type, komponentmønstre), men re-brander til **GFGK** (farger + festningssoldat-logo). Sluttresultat: GFGK-appen får AK HQ sitt redaksjonelle, datatette, premium uttrykk — i GFGK-drakt.

**Viktig avgrensning:** AK HQ er en coaching-analyseplattform. Vi adopterer kun det **domene-nøytrale** laget (tokens, type, knapper, kort, eyebrow, KPI, badges, timeline, tab-bar, inbox, daily-brief-layout, tomtilstander). Vi hopper over coaching-spesifikke komponenter (Trackman, Strokes Gained, pyramide, dispersjon, drill, spiller-tabeller).

## Designspråk vi adopterer (fra AK HQ)
- **Tre fonter:** Inter (UI) · Inter Tight (display, inkl. *editorial italic*) · JetBrains Mono (alle tall + eyebrow). Self-hostes som woff2 (følger med zip-en).
- **Eyebrow-signatur:** mono · 10px · UPPERCASE · 0.12em tracking. Erstatter dagens `SectionLabel`.
- **KPI-tall:** JetBrains Mono tabulær, store (`--text-3xl`). Norsk tallformat (komma-desimal, mellomrom-tusenskille, «48 %»).
- **Editorial-kort:** hvitt/lyst fyll + **3px aksent-venstrekant** (lime → gull). Brukes på event-/timeline-kort.
- **Featured/hero-kort:** mørk gradient, lys tekst, mono-eyebrow i aksent.
- **Knappesystem (4 varianter):** Primary, Accent (pill, signatur), Secondary (1px kant), Ghost. Radius 12px — **pill kun for accent-CTA, badges og chips** (reverserer «pill overalt» fra forrige runde).
- **8pt-grid (strengt), radius 8/12/16/20/24/full, subtile skygger** (flatt/editorial, skygge kun ved reelt løft).
- **Semantiske CSS-variabel-tokens** + ekte **dark mode**.
- **Lucide 1.5px, ingen emoji.** Norsk bokmål, datadrevet tone.

## Brand-mapping — AK HQ → GFGK (kjernebeslutningen)
AK HQ-rytmen er «mørk primær + lys signatur-aksent + varm cream». GFGK har akkurat samme rytme med andre farger:

| AK HQ token | AK HQ verdi | → GFGK verdi | Rolle |
|---|---|---|---|
| `--primary` | Forest `#005840` | **Charcoal `#0A0A0A`** | CTA-fyll, dark surfaces |
| `--primary-foreground` | Lime `#D1F843` | **Gull `#FFCC00`** | Tekst på primær (sort knapp, gull tekst) |
| `--accent` | Lime `#D1F843` | **Gull `#FFCC00`** | Signatur: aktiv/NÅ-markør, accent-badge, puls |
| `--accent-foreground` | Forest | **Charcoal `#0A0A0A`** | Tekst på gull |
| `--background` | Cream `#FAFAF7` | **Cream `#FAFAF8`** | Sidebakgrunn (varm, ikke hvit) |
| `--card` | Hvit `#FFFFFF` | **Hvit `#FFFFFF`** | Kort (løft mot cream) |
| dark `--background` | Forest `#0F2A22` | **Charcoal `#141414`** | Dark mode |
| `--info` | Blå `#2563EB` | **Teal `#0090A0`** | Info/positiv |
| `--destructive` | `#A32D2D` | **Rød `#E04040`** | Fare/avvist |
| `--success` | `#1A7D56` | Behold grønn (eller teal) | Suksess |
| pyramide-akser | rainbow | **droppes** | Coaching-spesifikt |

Netto: forest→charcoal, lime→gull. Primærknapp blir **sort fyll + gull tekst** (premium GFGK). Festningssoldat-logoen erstatter AK-monogrammet.

## Faser

### Fase 0 — Brand-mapping låses
Skriv `design-system/tokens.css` (semantiske CSS-variabler, light + dark) etter mapping-tabellen over. Dette blir kildesannhet (erstatter ad-hoc `gfgk-*`-bruk gradvis).

### Fase 1 — Foundations
- **Fonter:** kopier `Inter.woff2`, `InterTight.woff2`, `InterTight-Italic.woff2`, `JetBrainsMono.woff2` til `public/fonts/`; wire via `next/font/local` (erstatter Google Fonts-import i `globals.css`).
- **Tokens → Tailwind:** map `tailwind.config.ts` `gfgk-*` + nye semantiske navn (`bg`, `fg`, `card`, `primary`, `accent`, `muted`, `border`, `ring`) til CSS-variablene. Behold `gfgk-*` som aliaser for bakoverkomp.
- **Typografi-klasser** i `globals.css`: `.eyebrow`, `.kpi-value`, `.kpi-label`, `.h-display` (m/ `em.editorial`), `.h1/.h2/.h3`, `.font-mono` tabulær.
- 8pt spacing, radii, skygge-tokens fra AK HQ.

### Fase 2 — Kjernekomponenter (re-skinnet AK-mønstre)
Oppgrader eksisterende `src/components/ui/`:
- `Button` → 4 varianter (primary sort+gull / accent gull pill / secondary kant / ghost), radius 12, størrelser sm/md/lg (36/44/52px).
- **Ny** `Eyebrow` (erstatter `SectionLabel` gradvis), `KPI` (mono-tall + label), `Badge`/`Status` (m/ valgfri puls-dot).
- `Card` → editorial: hvitt fyll + valgfri 3px aksent-venstrekant; flat skygge.
- `Input`/`Select` → radius 12 (ikke pill), `--input`-kant, `--ring` fokus. (Reverserer pill-input.)
- `Pill`/`Chip` → badge-semantikk, pill beholdes her.
- **Ny** `Timeline`/`EventCard` (aksent-venstrekant), `FeaturedCard` (mørk gradient).
- `BottomNav`/`TabBar`, `EmptyState`, `Avatar` → align mot AK-spec.
- **Logo-lockups:** lag GFGK-varianter (festningssoldat på lys / på charcoal) som `Logo`-komponent; behold dagens header-logo.

### Fase 3 — Skjerm-utrulling (mobil-først, AK-mønster → GFGK-domene)
- **Dashboard:** AK «daily brief» → GFGK hilsen (Inter Tight + editorial italic) + KPI-strip (timer/vakter) + timeline (kommende vakter, aksent-venstrekant) + dagens sjekklister (progresjon).
- **Vakter/Kalender:** AK day-cal/month-cal-mønster, NÅ-markør i gull.
- **Oppgaver:** editorial liste-rader, status-badges.
- **Kunnskap:** editorial dokument-lesning (Inter Tight display).
- **Admin budsjett/lønn/rapporter:** KPI-kort (mono-tall), datatette tabeller, eyebrow-seksjoner.
- **Admin inbox:** AK inbox-mønster.

### Fase 4 — Logo & brand-assets
Festningssoldat-lockups i header/splash/login/favicon. GFGK-farger på alle aksenter.

### Fase 5 — Polish & verifisering
Dark-mode-pass, a11y (44px touch, kontrast 4.5:1, `prefers-reduced-motion`), `tsc`/`lint`/`build`, preview-skjermdumper på nøkkelskjermer.

## Kritiske filer
- Nye: `design-system/tokens.css`, `public/fonts/*.woff2`, `src/components/ui/{Eyebrow,KPI,Badge,Timeline,FeaturedCard,Logo}.tsx`.
- Endres: `tailwind.config.ts`, `src/app/globals.css`, `src/components/ui/{Button,Card,Input,Pill,SectionLabel}.tsx`, `BottomNav.tsx`, `PageHeader.tsx`/`SubHeader.tsx`, dashboard + nøkkelskjermer.
- Kilde (kopieres/leses fra): `~/Downloads/akhq-extract/` (`colors_and_type.css`, `README.md`, `fonts/`, `ui_kits/`, `preview/components-*.html`).

## Reconciliation med forrige runde
Denne planen **erstatter** «pill overalt»-retningen: pill forbeholdes accent-CTA/badges/chips (som AK HQ). Brighter GFGK-farger (#FFCC00 osv.) og festningssoldat-logo **beholdes**. De fire brukerne er allerede opprettet.

## Utenfor scope
Coaching-analyse-komponenter (Trackman/SG/pyramide/dispersjon/drill/spiller-tabeller). Tailwind v4-migrering (AK bruker v4 `@theme`; vi kan gjøre semantiske tokens i v3 først, v4 som egen senere beslutning). Full marketing-landingsside.

## Beslutninger å bekrefte
1. **Brand-mapping:** forest→charcoal, lime→gull (primærknapp = sort+gull). Anbefalt.
2. **Fonter:** self-host Inter + Inter Tight + JetBrains Mono (anbefalt — Inter Tight + mono er en stor del av uttrykket).
3. **Dark mode:** bygge inn nå eller senere.
4. **Demo-data:** fylle skjermene mens vi designer.
