import { boolean, date, decimal, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('user_role', ['admin', 'ansatt'])

export const preferredShiftEnum = pgEnum('preferred_shift', ['morgen', 'ettermiddag', 'kveld'])

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

export const projectStatusEnum = pgEnum('project_status', ['aktiv', 'fullfort', 'pause'])

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  deadline: date('deadline'),
  status: projectStatusEnum('status').notNull().default('aktiv'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  assignedTo: uuid('assigned_to').references(() => users.id),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
export type Task = typeof tasks.$inferSelect

// C-types
export type TimeOff = typeof timeOff.$inferSelect
export type TimeOffType = (typeof timeOffTypeEnum.enumValues)[number]
export type TimeOffStatus = (typeof timeOffStatusEnum.enumValues)[number]
export type ShiftTemplate = typeof shiftTemplates.$inferSelect
export type Activity = typeof activities.$inferSelect
export type ActivityType = (typeof activityTypeEnum.enumValues)[number]
export type ActivitySource = (typeof activitySourceEnum.enumValues)[number]
