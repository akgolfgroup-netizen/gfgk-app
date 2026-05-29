import {
  boolean,
  date,
  decimal,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// ============================================================
// Users + invites + roles
// ============================================================

export const roleEnum = pgEnum('user_role', ['admin', 'ansatt'])

export const preferredShiftEnum = pgEnum('preferred_shift', [
  'morgen',
  'ettermiddag',
  'kveld',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: roleEnum('role').notNull().default('ansatt'),
  hourlyRate: integer('hourly_rate'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  stillingsprosent: integer('stillingsprosent'),
  timerPerUke: decimal('timer_per_uke', { precision: 4, scale: 1 }),
  preferredShifts: preferredShiftEnum('preferred_shifts').array(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  role: roleEnum('role').notNull().default('ansatt'),
  token: text('token').notNull().unique(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
})

// ============================================================
// Vakter + timer + budsjett (M1–M6, beholdt)
// ============================================================

export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  date: date('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  note: text('note'),
  published: boolean('published').notNull().default(false),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const transactionTypeEnum = pgEnum('transaction_type', ['inntekt', 'utgift'])

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: transactionTypeEnum('type').notNull(),
  amount: integer('amount').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  date: date('date').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  shiftId: uuid('shift_id').references(() => shifts.id),
  date: date('date').notNull(),
  hours: decimal('hours', { precision: 4, scale: 2 }).notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================
// Notion-modul (M7): prosjekter + oppgaver + vedlegg + kommentarer
// ============================================================

export const projectStatusEnum = pgEnum('project_status', [
  'aktiv',
  'fullfort',
  'pause',
  'arkivert',
])

export const projectCoverEnum = pgEnum('project_cover', ['gold', 'teal', 'red', 'black'])

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('aktiv'),
  deadline: date('deadline'),
  coverColor: projectCoverEnum('cover_color').notNull().default('gold'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
})

export const projectMemberRoleEnum = pgEnum('project_member_role', ['eier', 'medlem'])

export const projectMembers = pgTable(
  'project_members',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: projectMemberRoleEnum('role').notNull().default('medlem'),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] })],
)

export const taskStatusEnum = pgEnum('task_status', [
  'todo',
  'in_progress',
  'waiting',
  'done',
])

export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high'])

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'), // self-ref for underoppgaver; FK lagt til separat
  title: text('title').notNull(),
  description: text('description'), // markdown
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  startAt: timestamp('start_at', { withTimezone: true }),
  endAt: timestamp('end_at', { withTimezone: true }),
  dueDate: date('due_date'),
  orderIndex: integer('order_index').notNull().default(0),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
})

export const taskAssignees = pgTable(
  'task_assignees',
  {
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.userId] })],
)

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  blobUrl: text('blob_url').notNull(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
})

export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(), // markdown
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================
// Sub-prosjekt F: Daglig drift
// ============================================================

// 1. Innstempling
export const shiftClocks = pgTable('shift_clocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  shiftId: uuid('shift_id').references(() => shifts.id),
  clockedInAt: timestamp('clocked_in_at', { withTimezone: true }).notNull(),
  clockedOutAt: timestamp('clocked_out_at', { withTimezone: true }),
  hours: decimal('hours', { precision: 4, scale: 2 }),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// 2. Sjekklister
export const checklistRepeatEnum = pgEnum('checklist_repeat', ['daglig', 'ukentlig', 'manedlig'])
export const checklistRoleEnum = pgEnum('checklist_role', ['ansatt', 'admin', 'alle'])

export const checklists = pgTable('checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  repeat: checklistRepeatEnum('repeat').notNull().default('daglig'),
  weekdays: text('weekdays').array(), // ['man','tir',...] når repeat=ukentlig
  assignedRole: checklistRoleEnum('assigned_role').notNull().default('ansatt'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const checklistItems = pgTable('checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  checklistId: uuid('checklist_id')
    .notNull()
    .references(() => checklists.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull().default(0),
})

export const checklistRuns = pgTable(
  'checklist_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    checklistId: uuid('checklist_id')
      .notNull()
      .references(() => checklists.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    completedBy: uuid('completed_by').references(() => users.id),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.checklistId, t.date] })],
)

export const checklistRunItems = pgTable('checklist_run_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id')
    .notNull()
    .references(() => checklistRuns.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id')
    .notNull()
    .references(() => checklistItems.id),
  done: boolean('done').notNull().default(false),
  doneAt: timestamp('done_at', { withTimezone: true }),
  doneBy: uuid('done_by').references(() => users.id),
  note: text('note'),
})

// 3. Annonseringer
export const announcementAudienceEnum = pgEnum('announcement_audience', [
  'alle',
  'admin',
  'ansatt',
])

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body').notNull(), // markdown
  audience: announcementAudienceEnum('audience').notNull().default('alle'),
  pinned: boolean('pinned').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const announcementReads = pgTable(
  'announcement_reads',
  {
    announcementId: uuid('announcement_id')
      .notNull()
      .references(() => announcements.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.announcementId, t.userId] })],
)

// 4. Hendelseslogg
export const shiftEventCategoryEnum = pgEnum('shift_event_category', [
  'hendelse',
  'klage',
  'maskin',
  'observasjon',
  'annet',
])

export const shiftEventSeverityEnum = pgEnum('shift_event_severity', [
  'info',
  'medium',
  'hoy',
])

export const shiftEvents = pgTable('shift_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  shiftId: uuid('shift_id').references(() => shifts.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  category: shiftEventCategoryEnum('category').notNull(),
  body: text('body').notNull(),
  severity: shiftEventSeverityEnum('severity').notNull().default('info'),
  attachments: text('attachments').array(), // blob URLs
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// 5. Dokumenter
export const documentCategoryEnum = pgEnum('document_category', [
  'kontrakt',
  'ferieattest',
  'sykmelding',
  'kvittering',
  'annet',
])

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // null = felles
  category: documentCategoryEnum('category').notNull(),
  name: text('name').notNull(),
  blobUrl: text('blob_url').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: date('expires_at'),
})

// ============================================================
// Sub-prosjekt C: Vaktliste 2.0 + kalender
// ============================================================

export const timeOffTypeEnum = pgEnum('time_off_type', ['ferie', 'sykemelding', 'permisjon'])
export const timeOffStatusEnum = pgEnum('time_off_status', ['pending', 'approved', 'declined'])

export const timeOff = pgTable('time_off', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  type: timeOffTypeEnum('type').notNull().default('ferie'),
  status: timeOffStatusEnum('status').notNull().default('pending'),
  note: text('note'),
  approvedBy: uuid('approved_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const shiftTemplates = pgTable('shift_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  startTime: text('start_time').notNull(), // '07:00'
  endTime: text('end_time').notNull(),     // '14:00'
  hours: decimal('hours', { precision: 4, scale: 1 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const activityTypeEnum = pgEnum('activity_type', [
  'turnering',
  'kurs',
  'intern',
  'sosial',
])

export const activitySourceEnum = pgEnum('activity_source', ['gfgk', 'ak_golf'])

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  type: activityTypeEnum('type').notNull().default('intern'),
  source: activitySourceEnum('source').notNull().default('gfgk'),
  externalId: text('external_id'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  location: text('location'),
  url: text('url'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================
// Types
// ============================================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Role = (typeof roleEnum.enumValues)[number]
export type Invite = typeof invites.$inferSelect
export type Shift = typeof shifts.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type TimeEntry = typeof timeEntries.$inferSelect

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number]
export type ProjectCover = (typeof projectCoverEnum.enumValues)[number]
export type ProjectMember = typeof projectMembers.$inferSelect

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number]
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number]
export type TaskAssignee = typeof taskAssignees.$inferSelect
export type Attachment = typeof attachments.$inferSelect
export type TaskComment = typeof taskComments.$inferSelect

// F-types
export type ShiftClock = typeof shiftClocks.$inferSelect
export type Checklist = typeof checklists.$inferSelect
export type ChecklistRepeat = (typeof checklistRepeatEnum.enumValues)[number]
export type ChecklistItem = typeof checklistItems.$inferSelect
export type ChecklistRun = typeof checklistRuns.$inferSelect
export type ChecklistRunItem = typeof checklistRunItems.$inferSelect
export type Announcement = typeof announcements.$inferSelect
export type AnnouncementAudience = (typeof announcementAudienceEnum.enumValues)[number]
export type ShiftEvent = typeof shiftEvents.$inferSelect
export type ShiftEventCategory = (typeof shiftEventCategoryEnum.enumValues)[number]
export type ShiftEventSeverity = (typeof shiftEventSeverityEnum.enumValues)[number]
export type Document = typeof documents.$inferSelect
export type DocumentCategory = (typeof documentCategoryEnum.enumValues)[number]

// C-types
export type TimeOff = typeof timeOff.$inferSelect
export type TimeOffType = (typeof timeOffTypeEnum.enumValues)[number]
export type TimeOffStatus = (typeof timeOffStatusEnum.enumValues)[number]
export type ShiftTemplate = typeof shiftTemplates.$inferSelect
export type Activity = typeof activities.$inferSelect
export type ActivityType = (typeof activityTypeEnum.enumValues)[number]
export type ActivitySource = (typeof activitySourceEnum.enumValues)[number]
