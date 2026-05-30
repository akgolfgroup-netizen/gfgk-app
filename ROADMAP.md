# GFGK Servicepunkt — Roadmap

Internt driftsverktøy for Gamle Fredrikstad Golfklubb. Tre bærebjelker:
**Arbeidsoppgaver · Rutiner · Struktur.** Alt mobil-først, for ansatte på farten.

> Status: designet er løftet til AK-editorial-uttrykk. Funksjonelt fundament finnes
> (oppgaver m/ tildeling/kommentarer/vedlegg, sjekklister m/ auto-generering via cron,
> vakter + innstempling, kunnskap, push-varsler, hendelseslogg, inbox). Denne roadmappen
> bygger videre på det — ikke fra null.

---

## Prinsipp
Verktøyet skal svare på tre spørsmål for hver ansatt, hver dag:
1. **Hva skal JEG gjøre nå?** (oppgaver + vakt + rutiner)
2. **Hvordan gjør jeg det riktig?** (rutine + SOP/kunnskap koblet til oppgaven)
3. **Er det gjort — og hvem har ansvar?** (ansvarlighet + sporbarhet)

---

## Fase 1 — Få driften til å flyte (høyest verdi, bygger på eksisterende)

**1. Gjentakende oppgaver + oppgavemaler**
Faste jobber (klippe greener man/ons/fre, tømme baller, vanne) opprettes automatisk.
Mal-bibliotek for vanlige jobber. → Mindre manuelt arbeid, ingenting glemmes.

**2. Rutine-ansvarlighet (sjekklister 2.0)**
- **Eskalering:** ikke fullført åpningsrutine innen kl. X → push til daglig leder.
- **Sporbarhet:** hvem krysset av hva, når (revisjonsspor — nyttig for HMS/kvalitet).
- **Bilde-bevis** på kritiske punkt (banetilstand, sikkerhet).
- Ukentlige/månedlige rutiner i tillegg til daglige.

**3. Sone-/lokasjonsmerking**
Tagg oppgaver og hendelser med sted (hull 1–18, klubbhus, range, pro shop, kafé).
Filtrer «alt på banen» vs «alt i pro shop». → Struktur i den fysiske driften.

**4. Daglig morgen-brief (push)**
Kl. 06:30: «God morgen — vakt 07:00–14:00, 3 oppgaver i dag, åpningsrutine venter.»
→ Én melding som starter arbeidsdagen.

## Fase 2 — Struktur & ansvar

**5. Roller, team og ansvarsmatrise**
Definer team (bane / pro shop / resepsjon / kafé) og hvem som eier hvilke
rutiner/områder. Tildel oppgaver til **rolle/team**, ikke bare person.

**6. Onboarding-flyt for nye ansatte**
Automatisk onboarding-sjekkliste + dokumenter + «les disse rutinene» (kunnskap)
når en ny ansatt opprettes. → Rask, lik opplæring.

**7. Kunnskap som SOP-arkiv, koblet til oppgaver/rutiner**
Hver rutine/oppgave kan lenke til relevant kunnskapsartikkel («Slik gjør du»).
→ Svar på «hvordan» rett der jobben gjøres.

**8. Vakt-overlevering (handover)**
Korte overleverings-notater mellom skift («range-maskin nr. 2 vakler, bestilt deler»).
→ Kontinuitet i skiftarbeid.

## Fase 3 — Innsikt & ledelse

**9. Drift-dashboard for daglig leder**
Én skjerm: hvem på jobb, fullføringsgrad rutiner i dag, forfalte oppgaver,
åpne hendelser/avvik. → Oversikt på 10 sekunder.

**10. Automatisk ukesrapport + smarte varsler**
Ukentlig oppsummering (gjort/ikke gjort, avvik, timer). Varsler ved upublisert
vaktliste, ufullførte rutiner, forfalte oppgaver.

---

## Tverrgående hurtig-gevinster (kan tas når som helst)
- **Aktivere bilde-opplasting** — sett `BLOB_READ_WRITE_TOKEN` (allerede bygget, mangler kun token).
- **Søk på tvers** — oppgaver, kunnskap, ansatte fra én søkeboks.
- **Dark mode** — kveldsbruk/lavlys i resepsjon (token-laget er forberedt).
- **Offline-robusthet (PWA)** — banen har dårlig dekning; cache rutiner/oppgaver.
- **Permanent Vercel-deploy** — stabil URL i stedet for tunnel, auto-deploy ved push.
- **Tilgangsstyring/sikkerhet** — verifiser at ansatt vs admin ser riktig; revisjon av server-actions.

---

## Anbefalt start
**Fase 1, steg 1–2** (gjentakende oppgaver + rutine-ansvarlighet) gir mest verdi raskest —
det er kjernen i «arbeidsoppgaver og rutiner» og bygger rett på sjekkliste-cronen og
oppgave-modellen som allerede finnes. Deretter steg 3–4 for daglig flyt.

Hurtig-gevinst parallelt: **aktivere bilde-opplasting** + **permanent deploy** (lav innsats, høy nytte).
