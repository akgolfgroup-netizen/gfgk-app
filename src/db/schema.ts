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
// Sub-prosjekt D: Kunnskapsbank + AI Inbox
// ============================================================

export const articleCategoryEnum = pgEnum('article_category', [
  'medlemskap',
  'drift',
  'faq',
  'prosedyrer',
  'annet',
])

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: articleCategoryEnum('category').notNull().default('annet'),
  body: text('body').notNull(), // markdown
  published: boolean('published').notNull().default(true),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
})

export const inboxStatusEnum = pgEnum('inbox_status', [
  'new',
  'draft_ready',
  'sent',
  'manual',
  'archived',
])

export const inboxMessages = pgTable('inbox_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: text('external_id').notNull().unique(),
  fromEmail: text('from_email').notNull(),
  fromName: text('from_name'),
  toEmail: text('to_email').notNull(),
  subject: text('subject').notNull(),
  bodyText: text('body_text'),
  bodyHtml: text('body_html'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  status: inboxStatusEnum('status').notNull().default('new'),
  aiDraft: text('ai_draft'),
  aiSkillUsed: text('ai_skill_used'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  sentBy: uuid('sent_by').references(() => users.id),
  threadId: text('thread_id'),
})

export const inboxSkills = pgTable('inbox_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  prompt: text('prompt').notNull(),
  exampleResponse: text('example_response'),
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

// D-types
export type Article = typeof articles.$inferSelect
export type ArticleCategory = (typeof articleCategoryEnum.enumValues)[number]
export type InboxMessage = typeof inboxMessages.$inferSelect
export type InboxStatus = (typeof inboxStatusEnum.enumValues)[number]
export type InboxSkill = typeof inboxSkills.$inferSelect
