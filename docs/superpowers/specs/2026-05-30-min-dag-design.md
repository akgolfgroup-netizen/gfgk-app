# «Min dag» — sammenhengende arbeidsdag

**Dato:** 2026-05-30
**Status:** Godkjent design — klar for implementeringsplan
**Tilnærming:** A — «Min dag» som ryggrad, bygd inkrementelt

## Kontekst og mål

GFGK Servicepunkt er et internt driftsverktøy for golfklubbens ansatte. Hovedfunksjonen er at **alt henger sammen** — oppgaver, rutiner, vakter og kunnskap skal bli ÉN sammenhengende arbeidsdag, ikke separate moduler.

I dag finnes modulene (Hjem/dashboard, Vakter + innstempling, Sjekklister, Oppgaver, Kunnskap, Hendelser), men de oppleves som adskilte destinasjoner. Bindevevet mangler: ansatten må selv hoppe mellom moduler og holde oversikt over hva som gjenstår.

**Mål:** Ansatten åpner appen og ser nøyaktig hva som gjenstår i dag, i rekkefølge, med fremdrift — og de eksisterende modulene blir byggeklosser i denne flyten.

## Konsept: Hjem-fanen blir «Min dag»

Hjem (`/dashboard`) reframes til en ordnet, handlbar dagsflyt. Hver seksjon viser status (✓ fullført / gjenstår), slik at hele dagen føles som én sjekkliste.

Rekkefølge på «Min dag»:
1. **Vakt i dag** — tid + Stempel inn/ut (finnes: `ClockButton`, `lib/clock.ts`)
2. **Dagens rutiner** — sjekklister for i dag m/ fremdrift (finnes: `checklistRuns` + cron `/api/cron/checklists`)
3. **Mine oppgaver i dag** — tildelte oppgaver med frist i dag/forfalt (NY seksjon på Hjem; data finnes i `tasks`/`taskAssignees`)
4. **Overlevering** — kort overlevering til/fra neste vakt (NY)

## Inkrementer

Hver inkrement gir verdi alene og kan shippes/commites for seg.

### Inkrement 1 — Min dag-flyt (først)
- Reframe `/dashboard` til ordnet dag. Behold hero-hilsen + KPI-strip.
- **Ny seksjon «Mine oppgaver i dag»:** oppgaver tildelt innlogget bruker med `dueDate` = i dag eller forfalt og status ≠ `done`. Avkryssbar (gjenbruk `toggleTaskDone`) + lenke til oppgavedetalj. Tom tilstand: «Ingen oppgaver med frist i dag.»
- **Inngang til overlevering** (plassholder-kort som peker til Inkrement 2; viser «Skriv overlevering» ved skiftslutt).
- Behold «Kommende vakter»-roster (hvem jobber) nederst.
- Ingen ny tabell. Kun UI + én ny spørring (mine oppgaver i dag).

### Inkrement 2 — Vakt-overlevering
- **Ny tabell `handovers`:** `id`, `date`, `fromUserId` (FK users), `note` (text), `openItems` (`text[]` — liste med korte punkter), `createdAt`.
- Ved skiftslutt (eller når som helst): ansatt skriver overlevering — fritekst + valgfrie åpne punkter.
- Neste vakt ser **siste overlevering for dagen** øverst i Min dag (eget kort): hvem, når, notat, åpne punkter.
- Server-actions i ny `lib/handovers.ts`: `createHandover`, `listTodaysHandovers`.
- Admin kan se overleveringer i hendelses-/drift-kontekst (valgfritt, ikke kritisk).

### Inkrement 3 — Koblinger mellom moduler
- **Sjekkpunkt → SOP:** valgfri `checklist_items.article_id` (FK articles). Når satt, viser sjekkpunktet en «Slik gjør du»-lenke til kunnskapsartikkelen. Admin velger artikkel ved opprettelse av sjekkliste.
- **Hendelse → oppgave:** «Lag oppgave»-knapp på en hendelse (`shift_events`) som oppretter en `tasks`-rad forhåndsutfylt med hendelsens tekst (gjenbruk `createTask`).
- **Oppgave → sone:** enkel valgfri `tasks.zone` (text) — hull/område (f.eks. «Hull 3», «Pro shop»). Vises som liten tag; filtrerbart senere.

### Inkrement 4 — Varsler som binder
- **Morgenbrief-push (06:30):** cron som sender push til ansatte med vakt i dag: «God morgen — vakt 07–14 · 3 oppgaver · åpningsrutine venter.» Gjenbruk push-infra (`pushSubscriptions`, `lib/notifications.ts`, web-push).
- **Påminnelse ufullført rutine:** cron senere på dagen som varsler hvis kritisk rutine ikke er fullført (terskel konfigurerbar, enkel start).
- Ingen ny tabell.

## Datamodell — oppsummert nytt
| Inkr. | Endring |
|---|---|
| 1 | Ingen DB-endring (UI + spørring) |
| 2 | Ny tabell `handovers` (`openItems text[]`) |
| 3 | `checklist_items.article_id` (FK), `tasks.zone` (text); hendelse→oppgave gjenbruker `tasks` |
| 4 | Ingen DB-endring (cron + push) |

DB-endringer påføres direkte (samme mønster som tidligere: schema.ts + SQL mot Neon), siden `drizzle-kit migrate` er ustabil med neon-http her.

## Arkitektur og gjenbruk
- **Sider:** `/dashboard` (reframes), evt. nye delkomponenter under `src/components/blocks/`.
- **Lib:** ny `src/lib/handovers.ts`; utvid `src/lib/tasks.ts` (sone), `src/lib/checklists.ts` (SOP-lenke), `src/lib/notifications.ts` (morgenbrief).
- **Komponenter:** gjenbruk AK-designsystemet (eyebrow, KPI, Card, SectionLabel, Pill, BottomSheet, ClockButton, ChecklistRunItem, TaskBlock).
- **Tilgang:** ansatt ser sin egen dag; admin-spesifikke deler bak rolle-sjekk som ellers.

## Avgrensning (YAGNI)
- Ingen full operativ tidslinje-omskriving (alternativ C forkastet).
- Overlevering = enkel tekst + åpne punkter, ikke et meldings-/chat-system.
- Sone = tekst-tag, ikke kart eller hull-geometri.
- Varsler starter enkelt (morgenbrief + én rutine-påminnelse), ikke full varslingsmotor.

## Suksesskriterium
Ansatten åpner Hjem og ser hele dagen i rekkefølge: vakt → rutiner → mine oppgaver → overlevering, med tydelig fremdrift. Skiftbytte mister ikke informasjon (overlevering). Man slipper å hoppe mellom moduler for å gjøre jobben (koblinger). Dagen starter av seg selv (morgenbrief).

## Verifisering
- Per inkrement: `pnpm typecheck` + `pnpm lint` rene; preview (mobil, innlogget demo) med demo-data; `preview_console_logs` uten feil.
- Inkr. 1: «Mine oppgaver i dag» viser riktige oppgaver, avkryssing fungerer, tom tilstand korrekt.
- Inkr. 2: skriv overlevering som én bruker → vises for neste.
- Inkr. 3: sjekkpunkt med SOP-lenke åpner artikkel; hendelse→oppgave oppretter riktig oppgave.
- Inkr. 4: morgenbrief sendes til bruker med vakt (test mot demo-abonnement).
