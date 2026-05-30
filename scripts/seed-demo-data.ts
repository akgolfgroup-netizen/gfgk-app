/**
 * Fyller databasen med realistisk demo-innhold for design/demo.
 * Idempotent: tømmer innholds-tabeller (IKKE users/invites) og fyller på nytt.
 *
 *   pnpm seed:data
 */
import { getDb } from '@/db'
import {
  activities,
  announcements,
  articles,
  checklistItems,
  checklistRunItems,
  checklistRuns,
  checklists,
  inboxMessages,
  projects,
  projectMembers,
  shiftEvents,
  shifts,
  taskAssignees,
  tasks,
  timeOff,
  transactions,
  users,
} from '@/db/schema'

function d(offsetDays: number): string {
  const dt = new Date()
  dt.setDate(dt.getDate() + offsetDays)
  return dt.toISOString().slice(0, 10)
}
function ts(offsetDays: number, hour: number, min = 0): Date {
  const dt = new Date()
  dt.setDate(dt.getDate() + offsetDays)
  dt.setHours(hour, min, 0, 0)
  return dt
}

function first<T>(rows: T[]): T {
  const r = rows[0]
  if (!r) throw new Error('Tom .returning() — insert ga ingen rad.')
  return r
}

async function main() {
  const db = getDb()

  // ---- Hent bruker-IDer ----
  const allUsers = await db.select().from(users)
  const byEmail = (e: string) => allUsers.find((u) => u.email === e)
  const admin = byEmail('njo@gfgk.no') ?? byEmail('demo@gfgk.no') ?? allUsers[0]
  if (!admin) throw new Error('Ingen brukere funnet — kjør seed:users / seed:demo først.')
  const ww = byEmail('ww@gfgk.no') ?? admin
  const vs = byEmail('vs@gfgk.no') ?? admin
  const mrp = byEmail('mrp@gfgk.no') ?? admin
  const demo = byEmail('demo@gfgk.no') ?? admin

  // ---- Tøm innholds-tabeller (rekkefølge respekterer FK) ----
  await db.delete(taskAssignees)
  await db.delete(tasks)
  await db.delete(projectMembers)
  await db.delete(projects)
  await db.delete(checklistRunItems)
  await db.delete(checklistRuns)
  await db.delete(checklistItems)
  await db.delete(checklists)
  await db.delete(shiftEvents)
  await db.delete(shifts)
  await db.delete(transactions)
  await db.delete(activities)
  await db.delete(announcements)
  await db.delete(articles)
  await db.delete(timeOff)
  await db.delete(inboxMessages)

  const staff = [demo, ww, vs, mrp]

  // ---- Vakter (publisert) for alle ansatte, i dag + 10 dager ----
  const shiftTimes: Array<[string, string, string]> = [
    ['07:00', '14:00', 'Åpning · resepsjon'],
    ['10:00', '16:00', 'Pro shop'],
    ['14:00', '21:00', 'Stenging · range'],
  ]
  const shiftRows = []
  for (let day = 0; day <= 10; day++) {
    for (let i = 0; i < staff.length; i++) {
      const u = staff[i]
      if (!u) continue
      // ikke alle jobber hver dag
      if ((day + i) % 3 === 0 && day !== 0) continue
      const [start, end, note] = shiftTimes[(day + i) % shiftTimes.length]!
      shiftRows.push({
        userId: u.id,
        date: d(day),
        startTime: start,
        endTime: end,
        note,
        published: true,
        createdBy: admin.id,
      })
    }
  }
  await db.insert(shifts).values(shiftRows)

  // ---- Transaksjoner inneværende måned ----
  const txRows = [
    { type: 'inntekt' as const, amount: 48500, category: 'Medlemskap', description: 'Sesongkort vår', date: d(-12) },
    { type: 'inntekt' as const, amount: 12300, category: 'Pro shop', description: 'Utstyrssalg', date: d(-8) },
    { type: 'inntekt' as const, amount: 8900, category: 'Range', description: 'Ballautomat', date: d(-5) },
    { type: 'inntekt' as const, amount: 15600, category: 'Turnering', description: 'Påmelding klubbmesterskap', date: d(-3) },
    { type: 'utgift' as const, amount: 22000, category: 'Lønn', description: 'Timelønn ansatte', date: d(-10) },
    { type: 'utgift' as const, amount: 6400, category: 'Bane', description: 'Gjødsel og frø', date: d(-7) },
    { type: 'utgift' as const, amount: 3200, category: 'Drift', description: 'Strøm klubbhus', date: d(-4) },
    { type: 'utgift' as const, amount: 1850, category: 'Pro shop', description: 'Varekjøp', date: d(-2) },
  ].map((t) => ({ ...t, createdBy: admin.id }))
  await db.insert(transactions).values(txRows)

  // ---- Sjekklister + dagens run ----
  const openingList = first(
    await db
      .insert(checklists)
      .values({
        name: 'Åpningsrutine',
        description: 'Gjøres hver morgen før første starttid.',
        repeat: 'daglig',
        assignedRole: 'alle',
        createdBy: admin.id,
      })
      .returning(),
  )
  const openingItems = await db
    .insert(checklistItems)
    .values([
      { checklistId: openingList.id, title: 'Lås opp klubbhus og pro shop', orderIndex: 0 },
      { checklistId: openingList.id, title: 'Slå på ballautomat og kaffemaskin', orderIndex: 1 },
      { checklistId: openingList.id, title: 'Sjekk greener for skader', orderIndex: 2 },
      { checklistId: openingList.id, title: 'Tøm søppel ved hull 1 og 10', orderIndex: 3 },
      { checklistId: openingList.id, title: 'Kontroller startliste i GolfBox', orderIndex: 4 },
    ])
    .returning()

  const closingList = first(
    await db
      .insert(checklists)
      .values({
        name: 'Stengerutine',
        description: 'Gjøres ved dagens slutt.',
        repeat: 'daglig',
        assignedRole: 'ansatt',
        createdBy: admin.id,
      })
      .returning(),
  )
  await db.insert(checklistItems).values([
    { checklistId: closingList.id, title: 'Tell kassen og lås safe', orderIndex: 0 },
    { checklistId: closingList.id, title: 'Slå av ballautomat', orderIndex: 1 },
    { checklistId: closingList.id, title: 'Lås alle dører', orderIndex: 2 },
  ])

  const run = first(
    await db
      .insert(checklistRuns)
      .values({ checklistId: openingList.id, date: d(0) })
      .returning(),
  )
  await db.insert(checklistRunItems).values(
    openingItems.map((it, i) => ({
      runId: run.id,
      itemId: it.id,
      done: i < 2, // to første er gjort
      doneAt: i < 2 ? ts(0, 7, 10) : null,
      doneBy: i < 2 ? (ww?.id ?? admin.id) : null,
    })),
  )

  // ---- Annonseringer ----
  await db.insert(announcements).values([
    {
      title: 'Klubbmesterskap 14.–15. juni',
      body: 'Påmelding er åpen i GolfBox. Vi trenger frivillige til startbod og kiosk — meld deg til Nils Jørgen.',
      audience: 'alle',
      pinned: true,
      createdBy: admin.id,
    },
    {
      title: 'Ny rutine for ballautomaten',
      body: 'Husk å tømme myntboksen ved stenging. Se oppdatert stengerutine i sjekklisten.',
      audience: 'ansatt',
      pinned: false,
      createdBy: admin.id,
    },
  ])

  // ---- Aktiviteter ----
  await db.insert(activities).values([
    { title: 'Klubbmesterskap 2026', type: 'turnering', source: 'gfgk', startAt: ts(15, 8), endAt: ts(16, 17), location: 'Banen', createdBy: admin.id },
    { title: 'Nybegynnerkurs (VTG)', type: 'kurs', source: 'gfgk', startAt: ts(4, 17), endAt: ts(4, 19), location: 'Treningsfeltet', createdBy: admin.id },
    { title: 'Damegolf-kveld', type: 'sosial', source: 'gfgk', startAt: ts(7, 17, 30), endAt: ts(7, 20), location: 'Hull 1–9', createdBy: admin.id },
    { title: 'Junior-trening', type: 'kurs', source: 'gfgk', startAt: ts(2, 16), endAt: ts(2, 17, 30), location: 'Range', createdBy: admin.id },
    { title: 'Seniortreff', type: 'sosial', source: 'gfgk', startAt: ts(9, 10), endAt: ts(9, 14), location: 'Klubbhus', createdBy: admin.id },
  ])

  // ---- Artikler (kunnskap) ----
  await db.insert(articles).values([
    {
      slug: 'apningstider-sesong',
      title: 'Åpningstider i sesongen',
      category: 'drift',
      body: '## Åpningstider\n\n- **Mandag–fredag:** 07:00–21:00\n- **Lørdag–søndag:** 08:00–20:00\n\nPro shop stenger 30 minutter før banen. Ved turnering kan tidene avvike — sjekk oppslag.',
      createdBy: admin.id,
    },
    {
      slug: 'handtere-medlemskap',
      title: 'Hvordan håndtere nye medlemskap',
      category: 'medlemskap',
      body: '1. Registrer medlemmet i GolfBox.\n2. Send velkomst-e-post med betalingslenke.\n3. Bestill medlemskort.\n4. Legg til i riktig medlemsgruppe.\n\n> Ved spørsmål om kontingent, kontakt daglig leder.',
      createdBy: admin.id,
    },
    {
      slug: 'ballautomat-feilsoking',
      title: 'Feilsøking ballautomat',
      category: 'prosedyrer',
      body: 'Hvis automaten ikke gir baller:\n\n- Sjekk at myntboksen ikke er full.\n- Restart med bryteren bak.\n- Fyll på baller fra lageret.\n\nFortsatt feil? Logg en hendelse (kategori **Maskin**) og ring servicepartner.',
      createdBy: admin.id,
    },
    {
      slug: 'vanlige-sporsmal',
      title: 'Vanlige spørsmål fra gjester',
      category: 'faq',
      body: '**Kan jeg spille uten medlemskap?**\nJa, greenfee kjøpes i pro shop eller GolfBox.\n\n**Leier dere ut utstyr?**\nVi har leiekøller og traller i pro shop.',
      createdBy: admin.id,
    },
  ])

  // ---- Prosjekt + oppgaver (tildelt demo for "Mine") ----
  const project = first(
    await db
      .insert(projects)
      .values({
        name: 'Sesongåpning vår 2026',
        description: 'Alt som må på plass før banen åpner for fullt.',
        status: 'aktiv',
        coverColor: 'gold',
        deadline: d(20),
        createdBy: admin.id,
      })
      .returning(),
  )
  await db.insert(projectMembers).values([
    { projectId: project.id, userId: admin.id, role: 'eier' },
    { projectId: project.id, userId: demo.id, role: 'medlem' },
    { projectId: project.id, userId: ww?.id ?? admin.id, role: 'medlem' },
  ])

  const taskRows = [
    { title: 'Bestille range-baller til sesongen', status: 'todo' as const, priority: 'high' as const, dueDate: d(-1) },
    { title: 'Oppdatere prisliste i pro shop', status: 'in_progress' as const, priority: 'medium' as const, dueDate: d(0) },
    { title: 'Klargjøre golfbiler', status: 'todo' as const, priority: 'medium' as const, dueDate: d(2) },
    { title: 'Henge opp ny banneret ved hull 1', status: 'todo' as const, priority: 'low' as const, dueDate: d(5) },
    { title: 'Sende ut sesongbrev til medlemmer', status: 'todo' as const, priority: 'high' as const, dueDate: null },
    { title: 'Rydde lager etter vinteren', status: 'done' as const, priority: 'low' as const, dueDate: d(-4) },
  ]
  const insertedTasks = await db
    .insert(tasks)
    .values(
      taskRows.map((t, i) => ({
        projectId: project.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        orderIndex: i,
        createdBy: admin.id,
      })),
    )
    .returning()
  await db.insert(taskAssignees).values(
    insertedTasks.map((t) => ({ taskId: t.id, userId: demo.id })),
  )

  // ---- Hendelseslogg ----
  await db.insert(shiftEvents).values([
    { userId: ww?.id ?? admin.id, category: 'maskin', body: 'Klippeaggregat på hull 3 mister blader. Bør sjekkes før helgen.', severity: 'medium' },
    { userId: vs?.id ?? admin.id, category: 'klage', body: 'Gjest klaget på våt bunker ved hull 7.', severity: 'info' },
    { userId: mrp?.id ?? admin.id, category: 'hendelse', body: 'Vannlekkasje oppdaget i pumpehus. Stengt av hovedkran.', severity: 'hoy' },
  ])

  // ---- Ferie/fri (pending for admin å behandle) ----
  await db.insert(timeOff).values({
    userId: ww?.id ?? admin.id,
    startDate: d(12),
    endDate: d(19),
    type: 'ferie',
    status: 'pending',
    note: 'Sommerferie uke 1',
  })

  // ---- Inbox (AI servicepunkt) ----
  await db.insert(inboxMessages).values([
    { externalId: 'demo-1', fromEmail: 'kari@example.no', fromName: 'Kari Hansen', toEmail: 'post@gfgk.no', subject: 'Spørsmål om greenfee', bodyText: 'Hei, hva koster greenfee for gjester i helgen?', receivedAt: ts(0, 8, 42), status: 'new' },
    { externalId: 'demo-2', fromEmail: 'ola@example.no', fromName: 'Ola Berg', toEmail: 'post@gfgk.no', subject: 'Melde meg inn', bodyText: 'Jeg ønsker å bli medlem. Hvordan går jeg fram?', receivedAt: ts(-1, 14, 10), status: 'draft_ready', aiDraft: 'Hei Ola! Hyggelig at du vil bli medlem...' },
  ])

  console.log('Demo-data seedet:')
  console.log(`  ${shiftRows.length} vakter, ${txRows.length} transaksjoner, 2 sjekklister, 5 aktiviteter, 4 artikler, ${insertedTasks.length} oppgaver, 3 hendelser, 2 inbox-meldinger.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
