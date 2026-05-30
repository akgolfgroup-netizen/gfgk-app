# GFGK Designsystem — MASTER

Kildesannhet for visuell stil i GFGK-appen (Next.js PWA). Generert med ui-ux-pro-max + GFGK-branding.
Når du bygger en side: les denne filen. Sjekk om `design-system/pages/<side>.md` finnes — den overstyrer i så fall MASTER.

**Retning:** «Rolig som Notion, presist som Linear.» Skill-anbefalt stil: *Data-Dense Dashboard* (tett, effektiv, maksimal datalesbarhet) temperert med Notions ro og luft. Mobil-først PWA, ≤640px designmål.

---

## 1. Merkevare-tokens (GFGK vinner over generiske forslag)

Disse finnes allerede i `tailwind.config.ts` som `gfgk-*`. Bruk dem som semantiske tokens — aldri rå hex i komponenter.

| Semantisk rolle | Token (Tailwind) | Hex |
|---|---|---|
| Primær / merkevare | `gfgk-gold` | `#F5C518` |
| Primær dyp (hover/trykk) | `gfgk-gold-deep` | `#D9A800` |
| Primær lys (flate/aksent) | `gfgk-gold-light` | `#FFF4D6` |
| Positiv / godkjent / inntekt | `gfgk-teal` | `#2BA8B0` |
| Positiv lys | `gfgk-teal-light` | `#DCF1F2` |
| Fare / avvist / utgift | `gfgk-red` | `#E94B3C` |
| Fare lys | `gfgk-red-light` | `#FCE9E5` |
| Mørk merkevareflate (header/splash) | `gfgk-black` | `#0A0A0A` |
| Mørk sekundær | `gfgk-charcoal` | `#1F1F1F` |
| Canvas (hovedbakgrunn) | `gfgk-cream` | `#FAF7EE` |
| Canvas sekundær | `gfgk-cream-deep` | `#F2EDE0` |
| Kort/panel | hvit | `#FFFFFF` |
| Tekst primær | `gfgk-text` | `#1B1B1B` |
| Tekst sekundær | `gfgk-text-2` | `#5A5A5A` |
| Tekst tertiær | `gfgk-text-3` | `#9C9C9C` |
| Kant standard | `gfgk-border` | `#E5E0D6` |
| Kant sterk | `gfgk-border-strong` | `#C9C2B3` |

**Splash-mapping** (fra prototypen): `--shell-dark` → `gfgk-black`, `--gold` → `gfgk-gold`, `--gold-soft` → en myk gull-flate (`gfgk-gold-light` på mørk, eller `rgba(245,197,24,0.12)`). Tagline: «Aktiv livet ut» (gull, italic, 13px).

### Regler for fargebruk
- **Gull = ÉN primærhandling per skjerm.** Aldri to gull-knapper samtidig (skill: `primary-action`).
- Statusfarge bærer alltid mening, aldri dekor (skill: `color-not-decorative-only`). Suppler med ikon/tekst, ikke bare farge.
- Kontrast: kroppstekst ≥ 4.5:1. `gfgk-text` på cream/hvit = OK. Gull tekst kun på `gfgk-black`, aldri på cream.
- Knappetekst på gull = `gfgk-black` (mørk på gull gir AA).

---

## 2. Typografi (Inter)

Skala (px): 12 / 13 / 15 / 18 / 24 / 28 / 48.

| Rolle | Størrelse | Vekt | Notat |
|---|---|---|---|
| Splash brand | 48 | 800 | letter-spacing -0.03em, gull |
| Sidetittel (TopHeader) | 28 | 800 | tett linjeavstand |
| Underside-tittel (SubHeader) | 18 | 600 | |
| Seksjonsetikett | 12 | 600 | UPPERCASE, tracking 0.06em, `gfgk-text-3` |
| Kroppstekst | 15 | 400–500 | line-height 1.5 |
| Metadata/hjelpetekst | 13 | 400 | `gfgk-text-2` |
| Tall i kolonner/priser/timer | — | — | `tabular-nums` (skill: `number-tabular`) |

Body minimum 16px på inputs for å unngå iOS auto-zoom (skill: `readable-font-size`).

---

## 3. Layout & spacing

- 4/8px spacing-rytme. Seksjonsnivåer: 16 / 24 / 32 / 48.
- Sidepadding horisontalt: `px-6` (24px). Bunnpadding over BottomNav: `pb-24` (96px).
- Safe area: `pt-safe` / `pb-safe` på headere og faste barer.
- `min-h-dvh` ikke `100vh`.
- Ingen horisontal scroll. Chip-filterrader scroller horisontalt med skjult scrollbar.
- Kort: hvit, 1px `gfgk-border`, `rounded-2xl` (16px), `borderCurve: continuous`-ekvivalent, myk skygge `0 1px 2px rgba(0,0,0,0.04)`.
- Konsistent elevasjonsskala — ingen tilfeldige skyggeverdier (skill: `elevation-consistent`).

---

## 4. Komponentkontrakt

Alle deles på tvers av appen. Bygg/oppgrader disse først.

- **TopHeader (mørk)** — `gfgk-black`-bånd, stor gull sidetittel + grå undertittel. Kun på de 5 hovedfanene + splash.
- **SubHeader (lys, Notion)** — cream bakgrunn, `ChevronLeft` tilbake, 18px tittel, valgfri handling høyre. På alle detalj-/undersider.
- **BottomNav** — fast bunn, ≤5 faner, Lucide-ikon + 13px etikett, aktiv i gull. Ansatt: Hjem/Oppgaver/Kalender/Profil. Admin: + Admin. `pb-safe`. Aktiv tilstand tydelig (skill: `nav-state-active`).
- **Button** — primær (gull fyll, `gfgk-black` tekst), sekundær (hvit, 1px kant), destruktiv (rød), ghost. Radius 12px, høyde ≥44px. Trykk: tonet hover/active 150–300ms, ingen layout-shift. Laster: spinner + disabled (skill: `loading-buttons`).
- **Card** — som §3.
- **ListRow (Linear-tett)** — for lange lister: 1px skillelinjer i stedet for separate kort, ~56px høyde, ikon/avatar venstre, tittel + metadata, status/chevron høyre. Hover: radmarkering (skill-effekt: row highlighting).
- **Pill/Status** — 12px, toner: gull (aktiv/venter), teal (ok), rød (fare), nøytral grå. Alltid med betydning.
- **Chip-filter** — pill, aktiv = gull fyll, inaktiv = hvit m/kant. Horisontal scroll-rad.
- **Avatar / AvatarStack** — sirkel, initialer/bilde, sm/md/lg; stack med hvit ring.
- **FAB** — flytende rund, gull, `Plus`, skygge, nede høyre, klar av safe-area.
- **BottomSheet** — glir opp fra bunn, hvit, øvre hjørner 20px, dra-håndtak, skjema inni. Animer fra trigger (skill: `modal-motion`). Bekreft ved lukking med ulagrede endringer.
- **EmptyState** — sentrert dempet Lucide-ikon (40px, tertiær), kort tittel, én linje hjelpetekst + ev. handling.
- **Progress** — tynn linje, teal eller gull.

Ikoner: **Lucide**, stroke 1.5px, konsistent str (sm/md=20–24). Aldri emoji. Aldri blande filled/outline på samme nivå.

---

## 5. Interaksjon & bevegelse

- Touch-mål ≥ 44×44px, ≥8px mellomrom (skill §2).
- Tilbakemelding på trykk innen ~100ms (tone/opacity), ingen bounds-shift.
- Mikro-animasjoner 150–300ms, ease-out inn / ease-in ut. Kun transform/opacity.
- Bottom sheets fjærer opp; lister stagger 30–50ms.
- Respekter `prefers-reduced-motion`.
- Skjema: synlig label (ikke kun placeholder), feil under feltet, `inputmode`/`type` riktig, vis/skjul-passord, valider på blur. Bekreft destruktive handlinger.

---

## 6. Tilgjengelighet (CRITICAL — skill §1)

- Kontrast 4.5:1 kropp / 3:1 stor tekst. Synlige fokusringer (2–4px) — fjern aldri.
- `aria-label` på ikon-knapper. Label↔input via `for`/`id`.
- Tab-rekkefølge = visuell rekkefølge. Skip-link på nav-tunge sider.
- Farge aldri eneste signal — suppler med ikon/tekst.
- Sekvensiell overskriftshierarki h1→h6.

---

## 7. Anti-mønstre å unngå

Fra skill + GFGK: ornamental design, manglende filtrering, emoji som ikoner, rå hex i komponenter, to primærknapper, gull tekst på lys flate, placeholder som eneste label, feil samlet kun på toppen, layout-shift ved hover, `100vh` på mobil, deaktivert zoom.

---

## 8. Pre-leveranse-sjekkliste (web)

- [ ] Ingen emoji som ikon; Lucide konsistent stroke 1.5px
- [ ] `cursor-pointer` på alt klikkbart; hover-overgang 150–300ms
- [ ] Kontrast 4.5:1 i lys modus; fokusringer synlige
- [ ] `prefers-reduced-motion` respektert
- [ ] Touch-mål ≥44px; safe-area øverst og nederst
- [ ] Responsiv 375 / 768 / 1024
- [ ] Semantiske tokens, ingen rå hex
- [ ] Én primær CTA per skjerm
