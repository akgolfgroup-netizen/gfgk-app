# GFGK — Design System

**Versjon:** 1.0
**Anker:** Festningssoldat-logoen.
**Format:** Mobile-first PWA, kun mobil i beta.
**Komplementerer:** `BRANDING.md` — brand-strategi og produkt-tone der; rent visuelt/teknisk her.

---

## 1. Logo som designens DNA

Logoen er ikke bare et merke — den definerer hele systemets visuelle språk. Hver designbeslutning utledes fra disse fem prinsippene:

| Prinsipp | Hva logoen viser | Hva det betyr for UI |
|---|---|---|
| **Flat fyllt** | Ingen gradienter, kun solide farger | Komponenter har solide fyll, ingen glass-effekter, ingen mesh-gradienter |
| **Sirkulær energi** | To swing-buer omkranser figuren | Avrundede hjørner (12-16 px), runde avatarer, sirkulære progress-indikatorer |
| **Komplementær balanse** | Gull + teal er motsatte på fargehjulet | Primær handling = gull, suksess/sekundær = teal, sammen aldri på samme element |
| **Diagonal drama** | Den røde kappen skjærer figuren | Røde aksenter brukes sparsomt for å trekke blikket (varsler, destruktiv) |
| **Kantete robusthet** | Figurens kropp er kantete, ikke organisk | Inter ExtraBold på titler, ingen håndskrift-fonter, ingen sentimentale ornamenter |

---

## 2. Color tokens (utledet direkte fra logoen)

### 2.1 Primær gull — figurens kropp og hoved-bue

| Token | Hex | Bruk | Tailwind |
|---|---|---|---|
| `gold` | `#F5C518` | Primær CTA, aktiv tab, fokus-ring | `bg-gfgk-gold` |
| `gold-deep` | `#D9A800` | Hover/pressed på gull | `bg-gfgk-gold-deep` |
| `gold-light` | `#FFF4D6` | Bakgrunn for fremhevd kort, gull pill | `bg-gfgk-gold-light` |

**Kontrastvurdering (WCAG):** Gull på sort = 11.6:1 (AAA). Gull på cream = 1.6:1 — IKKE bruk gull tekst på cream, kun gull tekst på sort.

### 2.2 Aksent teal — den komplementære swing-buen

| Token | Hex | Bruk |
|---|---|---|
| `teal` | `#2BA8B0` | Suksess-state, inntekt, fullført, AI-respons-aksent |
| `teal-deep` | `#1F8089` | Hover, tekst på teal-light |
| `teal-light` | `#DCF1F2` | Suksess-pill, AI-utkast-badge |

### 2.3 Aksent rød — kappens energi

| Token | Hex | Bruk |
|---|---|---|
| `red` | `#E94B3C` | Destruktiv, forfall, kritisk varsel |
| `red-deep` | `#C43A2C` | Tekst på red-light, hover |
| `red-light` | `#FCE9E5` | Destruktiv-pill, error-bakgrunn |

### 2.4 Anker sort + cream — kontrast og luft

| Token | Hex | Bruk |
|---|---|---|
| `black` | `#0A0A0A` | Header, bottom-nav, primær tekst på lys |
| `charcoal` | `#1F1F1F` | Bottom-nav-bakgrunn med 95 % opacity |
| `cream` | `#FAF7EE` | Global sidebakgrunn (ikke ren hvit — gir varme) |
| `cream-deep` | `#F2EDE0` | Sekundær bakgrunn (hover, valgte rader) |
| `white` | `#FFFFFF` | Kort, paneler, input-felt |

### 2.5 Tekst-skala

| Token | Hex | Bruk |
|---|---|---|
| `text` | `#1B1B1B` | Primær |
| `text-2` | `#5A5A5A` | Sekundær (meta, labels) |
| `text-3` | `#9C9C9C` | Tertiær (placeholders, disabled) |

### 2.6 Linjer

| Token | Hex | Bruk |
|---|---|---|
| `border` | `#E5E0D6` | Subtile linjer (kort, divider) |
| `border-strong` | `#C9C2B3` | Input-felt, knapp-outline |

---

## 3. Color usage — regler

**JA:**
- Gull dominerer i CTA, header-titler, aktive states
- Teal som "fullført", "inntekt", "AI har svart"
- Rød kun for destruktiv og forfall — ikke for "feil" generelt
- Cream-base over hele appen, hvite kort på toppen
- Sort header gir sterke ankerpunkt på hver side

**NEI:**
- Aldri gradient på bakgrunn eller knapp
- Aldri gull-tekst på cream eller hvit (for lav kontrast)
- Aldri kombiner rød og gull på samme element (forvirrende)
- Aldri bruk teal som primær handling (rolle er suksess/sekundær)
- Aldri grå knapper — bruk hvit eller cream-deep
- Aldri ekte hvit (#FFF) som sidebakgrunn — bruk cream

---

## 4. Form-språk

### 4.1 Hjørne-radier

| Bruk | Radius |
|---|---|
| Pills, badges, tags | `9999px` (full) |
| Avatarer, FAB | `9999px` (full) |
| Knapper | `8px` |
| Input-felt | `12px` |
| Kort, bottom-sheets | `12-16px` |
| Modal-dialog | `16px` |

### 4.2 Skygger

Alle skygger er subtile og imiterer naturlig lys ovenfra. Ingen "harde" boxshadows.

| Nivå | Bruk | CSS |
|---|---|---|
| 0 | Flat, ingen elevation | `none` |
| 1 | Cards, list items | `0 1px 2px rgba(0,0,0,.06)` |
| 2 | Active card, hovered | `0 2px 6px rgba(0,0,0,.08)` |
| 3 | FAB, sticky button | `0 4px 12px rgba(245,197,24,.4)` (gull glow) |
| 4 | Bottom sheet, modal | `0 -2px 16px rgba(0,0,0,.12)` |

### 4.3 Linjer & dividers

- Default: 1 px `border`
- Sterk: 1 px `border-strong` (input-felt)
- Aksent-strek: 4 px gull venstre-border (fremhevd card)
- Aksent-mini-strek: 14 × 2 px gull før section-label

---

## 5. Typografi

**Familie:** Inter (Variable, weights 400-900 via Google Fonts).

**Skala:**

| Rolle | Størrelse | Vekt | Tracking | Bruk |
|---|---|---|---|---|
| Display | 32 / 800 | -0.02em | Splash, store hero-titler |
| H1 | 24 / 800 | -0.01em | Page title |
| H2 | 18 / 700 | 0 | Section heading |
| H3 | 16 / 700 | 0 | Card title, block heading |
| Body | 15 / 400 | 0 | Default kropp |
| Body bold | 15 / 600 | 0 | Fremhevd kropp |
| Small | 13 / 500 | 0 | Meta, helper-tekst |
| Micro caption | 11 / 600 | uppercase, 0.12em | Section-labels, status-pills |

**Linjehøyde:** 1.2 (titler), 1.4 (kropp), 1.6 (kunnskapsartikler).

**Regler:**
- Aldri kursiv (bryter rytmen)
- Aldri understreking (kun linker — bruk farge i stedet)
- Title-tracking alltid `-0.01` til `-0.02em` (samlet, energisk)
- Caps reservert for micro-labels (≤ 11 px)

---

## 6. Spacing & layout

**Skala (4-base):** `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`

**Mobil-bredde-lock:**
```tsx
<div className="max-w-[480px] mx-auto min-h-dvh">
  {children}
</div>
```

**Standard padding:**
- Horisontalt utenfor kort: `px-6` (24 px)
- Inni kort: `p-4` (16 px)
- Mellom seksjoner: `space-y-8` (32 px)
- Header: `pt-safe pb-6 px-6`
- Body: `pt-6 pb-24 px-6`

**Touch targets:** Minimum 44 × 44 px (Apple HIG).

---

## 7. Motion & interaction

Bevegelsen skal speile logoens swing-energi: rolig, sikker, og naturlig avtagende.

### 7.1 Trykk-respons

```css
.pressable {
  transition: transform 100ms ease-out;
}
.pressable:active {
  transform: scale(0.97);
}
```

### 7.2 Sider-transisjoner

- Slide-from-right (push): 240 ms `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Fade (modal): 180 ms ease-out
- Bottom-sheet up: 260 ms `cubic-bezier(0.16, 1, 0.3, 1)` (spring-feel)

### 7.3 Loading-states

**Spinner** (kun for korte handlinger inni knapp):
- 24 px sirkel
- 2 px gull stroke
- Roterer 800 ms lineær
- Reflekterer swing-buene fra logoen

**Skeleton** (foretrukket for lister):
- `cream-deep` bakgrunn
- 1.4 s pulse-animasjon
- Matcher faktisk innhold-struktur

### 7.4 Reduced motion

Alltid respekt `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .pressable { transition: none; }
  .pressable:active { transform: none; }
}
```
Skift scale-animasjoner til opacity-fade.

---

## 8. Ikoner

**Bibliotek:** `lucide-react` (kun).

**Hvorfor Lucide:** Stroke-baserte ikoner med 2 px tykkelse matcher logoens "tegnede" stil — flat, kantete, men ikke harde. Rounded line-caps gir samme følelse som swing-buene.

**Størrelser:**

| Kontekst | Størrelse |
|---|---|
| Bottom-nav | 24 px |
| FAB | 24 px |
| Knapp ved siden av tekst | 18 px |
| Inline (i tekst) | 16 px |
| Pill-prefix | 14 px |

**Farger:**
- Inaktiv ikon: `text-2` (#5A5A5A)
- Aktiv ikon på lys: `text` (#1B1B1B)
- Aktiv ikon på sort: `gold`
- Destruktiv-ikon: `red-deep`
- Suksess-ikon: `teal-deep`

**Forbudt:**
- Aldri emojis (per CLAUDE.md)
- Aldri 3D-ikoner eller skeumorf
- Aldri ikoner med fyllt bakgrunn-shape (FontAwesome-stil)

---

## 9. Illustrasjon-system

For empty states, onboarding-skjermer og feilmeldinger trenger vi spot-illustrasjoner. Disse skal følge samme stil som logoen.

### 9.1 Regler for illustrasjoner

- Maks 3 farger pluss negativ-rom (cream eller hvit)
- Solide fyll, ingen gradienter
- Stiliserte figurer i samme "kantete" stil som festningssoldaten
- Sirkulære buer som komposisjons-element der relevant
- Ingen tekst inni illustrasjonen — la UI håndtere tekst

### 9.2 Eksempler på empty-state-illustrasjoner

| Sted | Motiv | Stemning |
|---|---|---|
| Ingen oppgaver | Festningssoldat sittende på en ball | "Rolig — ingenting å gjøre nå" |
| Ingen aktiviteter | Tom green med flagg | Stille forventning |
| Ingen meldinger | Festningssoldat med teleskop | "Speider etter meldinger" |
| Feilside | Festningssoldat som har mistet ballen | Beklagelse uten panikk |

Generer illustrasjonene i Claude Design med disse promptene. Lagre som SVG i `/public/illustrations/`.

---

## 10. Tailwind-mapping

Hele systemet er allerede i `tailwind.config.ts`:

```typescript
colors: {
  gfgk: {
    black: '#0A0A0A',
    charcoal: '#1F1F1F',
    gold: '#F5C518',
    'gold-deep': '#D9A800',
    'gold-light': '#FFF4D6',
    red: '#E94B3C',
    'red-deep': '#C43A2C',
    'red-light': '#FCE9E5',
    teal: '#2BA8B0',
    'teal-deep': '#1F8089',
    'teal-light': '#DCF1F2',
    cream: '#FAF7EE',
    'cream-deep': '#F2EDE0',
    text: '#1B1B1B',
    'text-2': '#5A5A5A',
    'text-3': '#9C9C9C',
    border: '#E5E0D6',
    'border-strong': '#C9C2B3',
  },
},
```

**Konvensjoner:**
- Aldri hardkode hex utenfor `tailwind.config.ts`
- Bruk `gfgk-*`-tokens (`bg-gfgk-gold`, `text-gfgk-text-2`)
- Bruk `cn()`-helper for betinget styling

---

## 11. Standardiserte mønstre (copy-paste)

### 11.1 Page header

```tsx
<header className="bg-gfgk-black px-6 pt-safe pb-6">
  <Link href="/forrige" className="text-sm text-white/50 hover:text-white/80">
    ← Forrige side
  </Link>
  <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gfgk-gold">
    Sidetittel
  </h1>
  <p className="mt-0.5 text-sm text-white/50">Undertittel</p>
</header>
```

### 11.2 Section label

```tsx
<h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
  <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
  Seksjonsnavn
</h2>
```

### 11.3 Card

```tsx
<div className="rounded-xl border border-gfgk-border border-l-4 border-l-gfgk-gold bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
  {children}
</div>
```

### 11.4 Primær knapp

```tsx
<button className="rounded-lg bg-gfgk-gold px-6 py-3 text-sm font-bold text-gfgk-black transition-colors hover:bg-gfgk-gold-deep active:scale-[0.97]">
  Bekreft
</button>
```

### 11.5 Status pill

```tsx
<span className="inline-flex h-6 items-center rounded-full bg-gfgk-gold-light px-2.5 text-[11px] font-semibold uppercase tracking-wider text-gfgk-gold-deep">
  Aktiv
</span>
```

### 11.6 FAB

```tsx
<button className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gfgk-gold shadow-[0_4px_12px_rgba(245,197,24,.4)] transition-transform active:scale-95">
  <Plus className="h-6 w-6 text-gfgk-black" strokeWidth={2.5} />
</button>
```

---

## 12. Designprinsipper (én-setninger)

1. **Cream først.** Aldri ren hvit som side-bakgrunn.
2. **Gull er handling.** Hvis det skal trykkes, er det gull.
3. **Teal er bekreftelse.** Hvis det er fullført eller positivt, er det teal.
4. **Rød er stopp.** Bare for destruktiv, forfall og kritisk.
5. **Sort er kontekst.** Headers og bottom-nav — aldri body-tekst.
6. **Festningssoldat-energi.** Solide flater, ingen gradient, ingen glass.
7. **Sirkulær bevegelse.** Avrunding speiler swing-buene.
8. **Norsk presisjon.** Ingen marketing-fluff, ingen emojis, ingen utropstegn.

---

## 13. QA-sjekkliste før merge

Hver PR skal verifiseres mot:

- [ ] Bruker kun `gfgk-*` color tokens (ingen hardkodede hex)
- [ ] Kontrast verifisert: AAA på tekst, AA på meta
- [ ] Touch-mål minimum 44 × 44 px
- [ ] Fokus-ring synlig ved tastatur-nav
- [ ] Ingen emojis, ingen marketing-fluff
- [ ] `prefers-reduced-motion` respektert
- [ ] Tested på 360 × 800 (iPhone SE) og 414 × 896 (iPhone Pro)
- [ ] Skeleton loader på lister (ikke spinner)
- [ ] Bottom-sheet i stedet for sentrer-modal der mulig

---

**Sist oppdatert:** 2026-05-27
**Eier:** Anders Kristiansen
**Logo-fil:** `/public/logo.png`
