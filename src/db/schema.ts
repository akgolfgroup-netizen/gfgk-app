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
