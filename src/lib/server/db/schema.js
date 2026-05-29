import { relations } from 'drizzle-orm';
import { boolean, index, integer, numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull()
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
  },
  (table) => [index('session_user_id_idx').on(table.userId)]
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull()
  },
  (table) => [
    index('account_user_id_idx').on(table.userId),
    index('account_provider_account_idx').on(table.providerId, table.accountId)
  ]
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull()
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const logisticLabel = pgTable(
  'logistic_label',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    gtin: varchar('gtin', { length: 14 }).notNull(),
    lotNumber: varchar('lot_number', { length: 20 }).notNull(),
    productionDate: text('production_date').notNull(),
    quantity: integer('quantity').notNull(),
    weightPounds: numeric('weight_pounds', { precision: 8, scale: 1 }).notNull(),
    sscc: varchar('sscc', { length: 18 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    printed: boolean('printed').notNull().default(false),
    pdfFile: text('pdf_file'),
    pdfPath: text('pdf_path'),
    printedBy: text('printed_by'),
    printedAt: timestamp('printed_at', { withTimezone: true })
  },
  (table) => [
    index('logistic_label_user_created_idx').on(table.userId, table.createdAt),
    index('logistic_label_user_gtin_idx').on(table.userId, table.gtin),
    index('logistic_label_user_lot_idx').on(table.userId, table.lotNumber)
  ]
);

export const labelSettings = pgTable('label_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull().default('Company Name'),
  gs1CompanyPrefix: varchar('gs1_company_prefix', { length: 12 }),
  extensionDigit: varchar('extension_digit', { length: 1 }).notNull().default('0'),
  nextSerialReference: integer('next_serial_reference').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  labels: many(logisticLabel),
  labelSettings: one(labelSettings, {
    fields: [user.id],
    references: [labelSettings.userId]
  })
}));

export const labelSettingsRelations = relations(labelSettings, ({ one }) => ({
  user: one(user, {
    fields: [labelSettings.userId],
    references: [user.id]
  })
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id]
  })
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id]
  })
}));

export const logisticLabelRelations = relations(logisticLabel, ({ one }) => ({
  user: one(user, {
    fields: [logisticLabel.userId],
    references: [user.id]
  })
}));
