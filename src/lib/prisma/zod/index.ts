import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.NullTypes.DbNull;
  if (v === 'JsonNull') return Prisma.NullTypes.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;

// DECIMAL
//------------------------------------------------------

export const DecimalJsLikeSchema: z.ZodType<Prisma.DecimalJsLike> = z.object({
  d: z.array(z.number()),
  e: z.number(),
  s: z.number(),
  toFixed: z.any(),
})

export const DECIMAL_STRING_REGEX = /^(?:-?Infinity|NaN|-?(?:0[bB][01]+(?:\.[01]+)?(?:[pP][-+]?\d+)?|0[oO][0-7]+(?:\.[0-7]+)?(?:[pP][-+]?\d+)?|0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?))$/;

export const isValidDecimalInput =
  (v?: null | string | number | Prisma.DecimalJsLike): v is string | number | Prisma.DecimalJsLike => {
    if (v === undefined || v === null) return false;
    return (
      (typeof v === 'object' && 'd' in v && 'e' in v && 's' in v && 'toFixed' in v) ||
      (typeof v === 'string' && DECIMAL_STRING_REGEX.test(v)) ||
      typeof v === 'number'
    )
  };

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','password_hash','onboarding_completed','created_at','updated_at']);

export const UserPreferencesScalarFieldEnumSchema = z.enum(['id','user_id','goals','lifestyles','ingredients_to_avoid','updated_at']);

export const StoreScalarFieldEnumSchema = z.enum(['id','name','logo_path','category','created_at']);

export const StoreAliasScalarFieldEnumSchema = z.enum(['id','store_id','alias']);

export const ReceiptScalarFieldEnumSchema = z.enum(['id','user_id','store_id','store_name_raw','receipt_date','currency_code','subtotal','tax','tax_rate','total','payment_method','payment_last4','scanned_text','image_uri','storage','status','error_message','created_at','updated_at']);

export const ReceiptItemScalarFieldEnumSchema = z.enum(['id','receipt_id','line_number','original_text','product_name','quantity','unit','unit_price','total_price','matched','match_score','qdrant_collection','qdrant_point_id','brand','category','subcategory','factor_co2_per_unit','factor_unit','factor_source','factor_version','is_eco_flag','flags']);

export const PromoScalarFieldEnumSchema = z.enum(['id','title','description','promo_type','store_id','icon_name','receipts_required','validity_start','validity_end','is_active','created_at']);

export const UserPromoScalarFieldEnumSchema = z.enum(['id','user_id','promo_id','is_available','redeemed_at','payload']);

export const AuditEventScalarFieldEnumSchema = z.enum(['id','user_id','entity','entity_id','action','data','created_at']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const JsonNullValueInputSchema = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const NullsOrderSchema = z.enum(['first','last']);
/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

/**
 * =========================
 * 1) CORE / USERS
 * =========================
 */
export const UserSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  onboarding_completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// USER PREFERENCES SCHEMA
/////////////////////////////////////////

/**
 * Preferencias (JSONB arrays)
 */
export const UserPreferencesSchema = z.object({
  id: z.cuid(),
  user_id: z.string(),
  goals: JsonValueSchema,
  lifestyles: JsonValueSchema,
  ingredients_to_avoid: JsonValueSchema,
  updated_at: z.coerce.date(),
})

export type UserPreferences = z.infer<typeof UserPreferencesSchema>

/////////////////////////////////////////
// STORE SCHEMA
/////////////////////////////////////////

/**
 * =========================
 * 2) STORES + ALIASES
 * =========================
 */
export const StoreSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  logo_path: z.string().nullable(),
  category: z.string().nullable(),
  created_at: z.coerce.date(),
})

export type Store = z.infer<typeof StoreSchema>

/////////////////////////////////////////
// STORE ALIAS SCHEMA
/////////////////////////////////////////

export const StoreAliasSchema = z.object({
  id: z.cuid(),
  store_id: z.string(),
  alias: z.string(),
})

export type StoreAlias = z.infer<typeof StoreAliasSchema>

/////////////////////////////////////////
// RECEIPT SCHEMA
/////////////////////////////////////////

/**
 * =========================
 * 3) RECEIPTS + ITEMS
 * =========================
 */
export const ReceiptSchema = z.object({
  id: z.cuid(),
  user_id: z.string(),
  store_id: z.string().nullable(),
  store_name_raw: z.string().nullable(),
  receipt_date: z.coerce.date().nullable(),
  currency_code: z.string(),
  subtotal: z.instanceof(Prisma.Decimal, { message: "Field 'subtotal' must be a Decimal. Location: ['Models', 'Receipt']"}).nullable(),
  tax: z.instanceof(Prisma.Decimal, { message: "Field 'tax' must be a Decimal. Location: ['Models', 'Receipt']"}).nullable(),
  tax_rate: z.instanceof(Prisma.Decimal, { message: "Field 'tax_rate' must be a Decimal. Location: ['Models', 'Receipt']"}).nullable(),
  total: z.instanceof(Prisma.Decimal, { message: "Field 'total' must be a Decimal. Location: ['Models', 'Receipt']"}).nullable(),
  payment_method: z.string().nullable(),
  payment_last4: z.string().nullable(),
  scanned_text: z.string().nullable(),
  image_uri: z.string().nullable(),
  storage: z.string(),
  status: z.string(),
  error_message: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Receipt = z.infer<typeof ReceiptSchema>

/////////////////////////////////////////
// RECEIPT ITEM SCHEMA
/////////////////////////////////////////

export const ReceiptItemSchema = z.object({
  id: z.cuid(),
  receipt_id: z.string(),
  line_number: z.number().int().nullable(),
  original_text: z.string().nullable(),
  product_name: z.string().nullable(),
  quantity: z.instanceof(Prisma.Decimal, { message: "Field 'quantity' must be a Decimal. Location: ['Models', 'ReceiptItem']"}).nullable(),
  unit: z.string().nullable(),
  unit_price: z.instanceof(Prisma.Decimal, { message: "Field 'unit_price' must be a Decimal. Location: ['Models', 'ReceiptItem']"}).nullable(),
  total_price: z.instanceof(Prisma.Decimal, { message: "Field 'total_price' must be a Decimal. Location: ['Models', 'ReceiptItem']"}).nullable(),
  matched: z.boolean(),
  match_score: z.instanceof(Prisma.Decimal, { message: "Field 'match_score' must be a Decimal. Location: ['Models', 'ReceiptItem']"}).nullable(),
  qdrant_collection: z.string().nullable(),
  qdrant_point_id: z.string().nullable(),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  subcategory: z.string().nullable(),
  factor_co2_per_unit: z.instanceof(Prisma.Decimal, { message: "Field 'factor_co2_per_unit' must be a Decimal. Location: ['Models', 'ReceiptItem']"}).nullable(),
  factor_unit: z.string().nullable(),
  factor_source: z.string().nullable(),
  factor_version: z.string().nullable(),
  is_eco_flag: z.boolean(),
  flags: JsonValueSchema,
})

export type ReceiptItem = z.infer<typeof ReceiptItemSchema>

/////////////////////////////////////////
// PROMO SCHEMA
/////////////////////////////////////////

/**
 * =========================
 * 4) PROMOS
 * =========================
 */
export const PromoSchema = z.object({
  id: z.cuid(),
  title: z.string(),
  description: z.string().nullable(),
  promo_type: z.string(),
  store_id: z.string().nullable(),
  icon_name: z.string().nullable(),
  receipts_required: z.number().int(),
  validity_start: z.coerce.date().nullable(),
  validity_end: z.coerce.date().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
})

export type Promo = z.infer<typeof PromoSchema>

/////////////////////////////////////////
// USER PROMO SCHEMA
/////////////////////////////////////////

export const UserPromoSchema = z.object({
  id: z.cuid(),
  user_id: z.string(),
  promo_id: z.string(),
  is_available: z.boolean(),
  redeemed_at: z.coerce.date().nullable(),
  payload: JsonValueSchema,
})

export type UserPromo = z.infer<typeof UserPromoSchema>

/////////////////////////////////////////
// AUDIT EVENT SCHEMA
/////////////////////////////////////////

/**
 * =========================
 * 5) AUDIT
 * =========================
 */
export const AuditEventSchema = z.object({
  id: z.cuid(),
  user_id: z.string().nullable(),
  entity: z.string(),
  entity_id: z.string().nullable(),
  action: z.string(),
  data: JsonValueSchema.nullable(),
  created_at: z.coerce.date(),
})

export type AuditEvent = z.infer<typeof AuditEventSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  preferences: z.union([z.boolean(),z.lazy(() => UserPreferencesArgsSchema)]).optional(),
  receipts: z.union([z.boolean(),z.lazy(() => ReceiptFindManyArgsSchema)]).optional(),
  userPromos: z.union([z.boolean(),z.lazy(() => UserPromoFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  receipts: z.boolean().optional(),
  userPromos: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  email: z.boolean().optional(),
  password_hash: z.boolean().optional(),
  onboarding_completed: z.boolean().optional(),
  created_at: z.boolean().optional(),
  updated_at: z.boolean().optional(),
  preferences: z.union([z.boolean(),z.lazy(() => UserPreferencesArgsSchema)]).optional(),
  receipts: z.union([z.boolean(),z.lazy(() => ReceiptFindManyArgsSchema)]).optional(),
  userPromos: z.union([z.boolean(),z.lazy(() => UserPromoFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// USER PREFERENCES
//------------------------------------------------------

export const UserPreferencesIncludeSchema: z.ZodType<Prisma.UserPreferencesInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const UserPreferencesArgsSchema: z.ZodType<Prisma.UserPreferencesDefaultArgs> = z.object({
  select: z.lazy(() => UserPreferencesSelectSchema).optional(),
  include: z.lazy(() => UserPreferencesIncludeSchema).optional(),
}).strict();

export const UserPreferencesSelectSchema: z.ZodType<Prisma.UserPreferencesSelect> = z.object({
  id: z.boolean().optional(),
  user_id: z.boolean().optional(),
  goals: z.boolean().optional(),
  lifestyles: z.boolean().optional(),
  ingredients_to_avoid: z.boolean().optional(),
  updated_at: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// STORE
//------------------------------------------------------

export const StoreIncludeSchema: z.ZodType<Prisma.StoreInclude> = z.object({
  receipts: z.union([z.boolean(),z.lazy(() => ReceiptFindManyArgsSchema)]).optional(),
  promos: z.union([z.boolean(),z.lazy(() => PromoFindManyArgsSchema)]).optional(),
  aliases: z.union([z.boolean(),z.lazy(() => StoreAliasFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => StoreCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const StoreArgsSchema: z.ZodType<Prisma.StoreDefaultArgs> = z.object({
  select: z.lazy(() => StoreSelectSchema).optional(),
  include: z.lazy(() => StoreIncludeSchema).optional(),
}).strict();

export const StoreCountOutputTypeArgsSchema: z.ZodType<Prisma.StoreCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => StoreCountOutputTypeSelectSchema).nullish(),
}).strict();

export const StoreCountOutputTypeSelectSchema: z.ZodType<Prisma.StoreCountOutputTypeSelect> = z.object({
  receipts: z.boolean().optional(),
  promos: z.boolean().optional(),
  aliases: z.boolean().optional(),
}).strict();

export const StoreSelectSchema: z.ZodType<Prisma.StoreSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  logo_path: z.boolean().optional(),
  category: z.boolean().optional(),
  created_at: z.boolean().optional(),
  receipts: z.union([z.boolean(),z.lazy(() => ReceiptFindManyArgsSchema)]).optional(),
  promos: z.union([z.boolean(),z.lazy(() => PromoFindManyArgsSchema)]).optional(),
  aliases: z.union([z.boolean(),z.lazy(() => StoreAliasFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => StoreCountOutputTypeArgsSchema)]).optional(),
}).strict()

// STORE ALIAS
//------------------------------------------------------

export const StoreAliasIncludeSchema: z.ZodType<Prisma.StoreAliasInclude> = z.object({
  store: z.union([z.boolean(),z.lazy(() => StoreArgsSchema)]).optional(),
}).strict();

export const StoreAliasArgsSchema: z.ZodType<Prisma.StoreAliasDefaultArgs> = z.object({
  select: z.lazy(() => StoreAliasSelectSchema).optional(),
  include: z.lazy(() => StoreAliasIncludeSchema).optional(),
}).strict();

export const StoreAliasSelectSchema: z.ZodType<Prisma.StoreAliasSelect> = z.object({
  id: z.boolean().optional(),
  store_id: z.boolean().optional(),
  alias: z.boolean().optional(),
  store: z.union([z.boolean(),z.lazy(() => StoreArgsSchema)]).optional(),
}).strict()

// RECEIPT
//------------------------------------------------------

export const ReceiptIncludeSchema: z.ZodType<Prisma.ReceiptInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  store: z.union([z.boolean(),z.lazy(() => StoreArgsSchema)]).optional(),
  items: z.union([z.boolean(),z.lazy(() => ReceiptItemFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ReceiptCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const ReceiptArgsSchema: z.ZodType<Prisma.ReceiptDefaultArgs> = z.object({
  select: z.lazy(() => ReceiptSelectSchema).optional(),
  include: z.lazy(() => ReceiptIncludeSchema).optional(),
}).strict();

export const ReceiptCountOutputTypeArgsSchema: z.ZodType<Prisma.ReceiptCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => ReceiptCountOutputTypeSelectSchema).nullish(),
}).strict();

export const ReceiptCountOutputTypeSelectSchema: z.ZodType<Prisma.ReceiptCountOutputTypeSelect> = z.object({
  items: z.boolean().optional(),
}).strict();

export const ReceiptSelectSchema: z.ZodType<Prisma.ReceiptSelect> = z.object({
  id: z.boolean().optional(),
  user_id: z.boolean().optional(),
  store_id: z.boolean().optional(),
  store_name_raw: z.boolean().optional(),
  receipt_date: z.boolean().optional(),
  currency_code: z.boolean().optional(),
  subtotal: z.boolean().optional(),
  tax: z.boolean().optional(),
  tax_rate: z.boolean().optional(),
  total: z.boolean().optional(),
  payment_method: z.boolean().optional(),
  payment_last4: z.boolean().optional(),
  scanned_text: z.boolean().optional(),
  image_uri: z.boolean().optional(),
  storage: z.boolean().optional(),
  status: z.boolean().optional(),
  error_message: z.boolean().optional(),
  created_at: z.boolean().optional(),
  updated_at: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  store: z.union([z.boolean(),z.lazy(() => StoreArgsSchema)]).optional(),
  items: z.union([z.boolean(),z.lazy(() => ReceiptItemFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ReceiptCountOutputTypeArgsSchema)]).optional(),
}).strict()

// RECEIPT ITEM
//------------------------------------------------------

export const ReceiptItemIncludeSchema: z.ZodType<Prisma.ReceiptItemInclude> = z.object({
  receipt: z.union([z.boolean(),z.lazy(() => ReceiptArgsSchema)]).optional(),
}).strict();

export const ReceiptItemArgsSchema: z.ZodType<Prisma.ReceiptItemDefaultArgs> = z.object({
  select: z.lazy(() => ReceiptItemSelectSchema).optional(),
  include: z.lazy(() => ReceiptItemIncludeSchema).optional(),
}).strict();

export const ReceiptItemSelectSchema: z.ZodType<Prisma.ReceiptItemSelect> = z.object({
  id: z.boolean().optional(),
  receipt_id: z.boolean().optional(),
  line_number: z.boolean().optional(),
  original_text: z.boolean().optional(),
  product_name: z.boolean().optional(),
  quantity: z.boolean().optional(),
  unit: z.boolean().optional(),
  unit_price: z.boolean().optional(),
  total_price: z.boolean().optional(),
  matched: z.boolean().optional(),
  match_score: z.boolean().optional(),
  qdrant_collection: z.boolean().optional(),
  qdrant_point_id: z.boolean().optional(),
  brand: z.boolean().optional(),
  category: z.boolean().optional(),
  subcategory: z.boolean().optional(),
  factor_co2_per_unit: z.boolean().optional(),
  factor_unit: z.boolean().optional(),
  factor_source: z.boolean().optional(),
  factor_version: z.boolean().optional(),
  is_eco_flag: z.boolean().optional(),
  flags: z.boolean().optional(),
  receipt: z.union([z.boolean(),z.lazy(() => ReceiptArgsSchema)]).optional(),
}).strict()

// PROMO
//------------------------------------------------------

export const PromoIncludeSchema: z.ZodType<Prisma.PromoInclude> = z.object({
  store: z.union([z.boolean(),z.lazy(() => StoreArgsSchema)]).optional(),
  userPromos: z.union([z.boolean(),z.lazy(() => UserPromoFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PromoCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const PromoArgsSchema: z.ZodType<Prisma.PromoDefaultArgs> = z.object({
  select: z.lazy(() => PromoSelectSchema).optional(),
  include: z.lazy(() => PromoIncludeSchema).optional(),
}).strict();

export const PromoCountOutputTypeArgsSchema: z.ZodType<Prisma.PromoCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => PromoCountOutputTypeSelectSchema).nullish(),
}).strict();

export const PromoCountOutputTypeSelectSchema: z.ZodType<Prisma.PromoCountOutputTypeSelect> = z.object({
  userPromos: z.boolean().optional(),
}).strict();

export const PromoSelectSchema: z.ZodType<Prisma.PromoSelect> = z.object({
  id: z.boolean().optional(),
  title: z.boolean().optional(),
  description: z.boolean().optional(),
  promo_type: z.boolean().optional(),
  store_id: z.boolean().optional(),
  icon_name: z.boolean().optional(),
  receipts_required: z.boolean().optional(),
  validity_start: z.boolean().optional(),
  validity_end: z.boolean().optional(),
  is_active: z.boolean().optional(),
  created_at: z.boolean().optional(),
  store: z.union([z.boolean(),z.lazy(() => StoreArgsSchema)]).optional(),
  userPromos: z.union([z.boolean(),z.lazy(() => UserPromoFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PromoCountOutputTypeArgsSchema)]).optional(),
}).strict()

// USER PROMO
//------------------------------------------------------

export const UserPromoIncludeSchema: z.ZodType<Prisma.UserPromoInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  promo: z.union([z.boolean(),z.lazy(() => PromoArgsSchema)]).optional(),
}).strict();

export const UserPromoArgsSchema: z.ZodType<Prisma.UserPromoDefaultArgs> = z.object({
  select: z.lazy(() => UserPromoSelectSchema).optional(),
  include: z.lazy(() => UserPromoIncludeSchema).optional(),
}).strict();

export const UserPromoSelectSchema: z.ZodType<Prisma.UserPromoSelect> = z.object({
  id: z.boolean().optional(),
  user_id: z.boolean().optional(),
  promo_id: z.boolean().optional(),
  is_available: z.boolean().optional(),
  redeemed_at: z.boolean().optional(),
  payload: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  promo: z.union([z.boolean(),z.lazy(() => PromoArgsSchema)]).optional(),
}).strict()

// AUDIT EVENT
//------------------------------------------------------

export const AuditEventSelectSchema: z.ZodType<Prisma.AuditEventSelect> = z.object({
  id: z.boolean().optional(),
  user_id: z.boolean().optional(),
  entity: z.boolean().optional(),
  entity_id: z.boolean().optional(),
  action: z.boolean().optional(),
  data: z.boolean().optional(),
  created_at: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  password_hash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  onboarding_completed: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updated_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  preferences: z.union([ z.lazy(() => UserPreferencesNullableScalarRelationFilterSchema), z.lazy(() => UserPreferencesWhereInputSchema) ]).optional().nullable(),
  receipts: z.lazy(() => ReceiptListRelationFilterSchema).optional(),
  userPromos: z.lazy(() => UserPromoListRelationFilterSchema).optional(),
});

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  password_hash: z.lazy(() => SortOrderSchema).optional(),
  onboarding_completed: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
  preferences: z.lazy(() => UserPreferencesOrderByWithRelationInputSchema).optional(),
  receipts: z.lazy(() => ReceiptOrderByRelationAggregateInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoOrderByRelationAggregateInputSchema).optional(),
});

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    email: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    email: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  email: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  password_hash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  onboarding_completed: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updated_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  preferences: z.union([ z.lazy(() => UserPreferencesNullableScalarRelationFilterSchema), z.lazy(() => UserPreferencesWhereInputSchema) ]).optional().nullable(),
  receipts: z.lazy(() => ReceiptListRelationFilterSchema).optional(),
  userPromos: z.lazy(() => UserPromoListRelationFilterSchema).optional(),
}));

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  password_hash: z.lazy(() => SortOrderSchema).optional(),
  onboarding_completed: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional(),
});

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  password_hash: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  onboarding_completed: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  created_at: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updated_at: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const UserPreferencesWhereInputSchema: z.ZodType<Prisma.UserPreferencesWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserPreferencesWhereInputSchema), z.lazy(() => UserPreferencesWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserPreferencesWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserPreferencesWhereInputSchema), z.lazy(() => UserPreferencesWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  user_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  goals: z.lazy(() => JsonFilterSchema).optional(),
  lifestyles: z.lazy(() => JsonFilterSchema).optional(),
  ingredients_to_avoid: z.lazy(() => JsonFilterSchema).optional(),
  updated_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const UserPreferencesOrderByWithRelationInputSchema: z.ZodType<Prisma.UserPreferencesOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  goals: z.lazy(() => SortOrderSchema).optional(),
  lifestyles: z.lazy(() => SortOrderSchema).optional(),
  ingredients_to_avoid: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const UserPreferencesWhereUniqueInputSchema: z.ZodType<Prisma.UserPreferencesWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    user_id: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    user_id: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string().optional(),
  AND: z.union([ z.lazy(() => UserPreferencesWhereInputSchema), z.lazy(() => UserPreferencesWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserPreferencesWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserPreferencesWhereInputSchema), z.lazy(() => UserPreferencesWhereInputSchema).array() ]).optional(),
  goals: z.lazy(() => JsonFilterSchema).optional(),
  lifestyles: z.lazy(() => JsonFilterSchema).optional(),
  ingredients_to_avoid: z.lazy(() => JsonFilterSchema).optional(),
  updated_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const UserPreferencesOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserPreferencesOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  goals: z.lazy(() => SortOrderSchema).optional(),
  lifestyles: z.lazy(() => SortOrderSchema).optional(),
  ingredients_to_avoid: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserPreferencesCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserPreferencesMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserPreferencesMinOrderByAggregateInputSchema).optional(),
});

export const UserPreferencesScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserPreferencesScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserPreferencesScalarWhereWithAggregatesInputSchema), z.lazy(() => UserPreferencesScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserPreferencesScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserPreferencesScalarWhereWithAggregatesInputSchema), z.lazy(() => UserPreferencesScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  user_id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  goals: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  lifestyles: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  ingredients_to_avoid: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  updated_at: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const StoreWhereInputSchema: z.ZodType<Prisma.StoreWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => StoreWhereInputSchema), z.lazy(() => StoreWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => StoreWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StoreWhereInputSchema), z.lazy(() => StoreWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  logo_path: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  receipts: z.lazy(() => ReceiptListRelationFilterSchema).optional(),
  promos: z.lazy(() => PromoListRelationFilterSchema).optional(),
  aliases: z.lazy(() => StoreAliasListRelationFilterSchema).optional(),
});

export const StoreOrderByWithRelationInputSchema: z.ZodType<Prisma.StoreOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  logo_path: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  category: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  receipts: z.lazy(() => ReceiptOrderByRelationAggregateInputSchema).optional(),
  promos: z.lazy(() => PromoOrderByRelationAggregateInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasOrderByRelationAggregateInputSchema).optional(),
});

export const StoreWhereUniqueInputSchema: z.ZodType<Prisma.StoreWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    name: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    name: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  name: z.string().optional(),
  AND: z.union([ z.lazy(() => StoreWhereInputSchema), z.lazy(() => StoreWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => StoreWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StoreWhereInputSchema), z.lazy(() => StoreWhereInputSchema).array() ]).optional(),
  logo_path: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  receipts: z.lazy(() => ReceiptListRelationFilterSchema).optional(),
  promos: z.lazy(() => PromoListRelationFilterSchema).optional(),
  aliases: z.lazy(() => StoreAliasListRelationFilterSchema).optional(),
}));

export const StoreOrderByWithAggregationInputSchema: z.ZodType<Prisma.StoreOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  logo_path: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  category: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => StoreCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => StoreMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => StoreMinOrderByAggregateInputSchema).optional(),
});

export const StoreScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.StoreScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => StoreScalarWhereWithAggregatesInputSchema), z.lazy(() => StoreScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => StoreScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StoreScalarWhereWithAggregatesInputSchema), z.lazy(() => StoreScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  logo_path: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  created_at: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const StoreAliasWhereInputSchema: z.ZodType<Prisma.StoreAliasWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => StoreAliasWhereInputSchema), z.lazy(() => StoreAliasWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => StoreAliasWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StoreAliasWhereInputSchema), z.lazy(() => StoreAliasWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  alias: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  store: z.union([ z.lazy(() => StoreScalarRelationFilterSchema), z.lazy(() => StoreWhereInputSchema) ]).optional(),
});

export const StoreAliasOrderByWithRelationInputSchema: z.ZodType<Prisma.StoreAliasOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  alias: z.lazy(() => SortOrderSchema).optional(),
  store: z.lazy(() => StoreOrderByWithRelationInputSchema).optional(),
});

export const StoreAliasWhereUniqueInputSchema: z.ZodType<Prisma.StoreAliasWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    alias: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    alias: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  alias: z.string().optional(),
  AND: z.union([ z.lazy(() => StoreAliasWhereInputSchema), z.lazy(() => StoreAliasWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => StoreAliasWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StoreAliasWhereInputSchema), z.lazy(() => StoreAliasWhereInputSchema).array() ]).optional(),
  store_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  store: z.union([ z.lazy(() => StoreScalarRelationFilterSchema), z.lazy(() => StoreWhereInputSchema) ]).optional(),
}));

export const StoreAliasOrderByWithAggregationInputSchema: z.ZodType<Prisma.StoreAliasOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  alias: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => StoreAliasCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => StoreAliasMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => StoreAliasMinOrderByAggregateInputSchema).optional(),
});

export const StoreAliasScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.StoreAliasScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => StoreAliasScalarWhereWithAggregatesInputSchema), z.lazy(() => StoreAliasScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => StoreAliasScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StoreAliasScalarWhereWithAggregatesInputSchema), z.lazy(() => StoreAliasScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  alias: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
});

export const ReceiptWhereInputSchema: z.ZodType<Prisma.ReceiptWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReceiptWhereInputSchema), z.lazy(() => ReceiptWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReceiptWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReceiptWhereInputSchema), z.lazy(() => ReceiptWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  user_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  store_name_raw: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  receipt_date: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  currency_code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  subtotal: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  tax: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  tax_rate: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  total: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  payment_method: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  payment_last4: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  scanned_text: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  image_uri: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  storage: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  error_message: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updated_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  store: z.union([ z.lazy(() => StoreNullableScalarRelationFilterSchema), z.lazy(() => StoreWhereInputSchema) ]).optional().nullable(),
  items: z.lazy(() => ReceiptItemListRelationFilterSchema).optional(),
});

export const ReceiptOrderByWithRelationInputSchema: z.ZodType<Prisma.ReceiptOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  store_name_raw: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  receipt_date: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  currency_code: z.lazy(() => SortOrderSchema).optional(),
  subtotal: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  tax: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  tax_rate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  total: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  payment_method: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  payment_last4: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  scanned_text: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  image_uri: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  storage: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  error_message: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  store: z.lazy(() => StoreOrderByWithRelationInputSchema).optional(),
  items: z.lazy(() => ReceiptItemOrderByRelationAggregateInputSchema).optional(),
});

export const ReceiptWhereUniqueInputSchema: z.ZodType<Prisma.ReceiptWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => ReceiptWhereInputSchema), z.lazy(() => ReceiptWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReceiptWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReceiptWhereInputSchema), z.lazy(() => ReceiptWhereInputSchema).array() ]).optional(),
  user_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  store_name_raw: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  receipt_date: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  currency_code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  subtotal: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  tax: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  tax_rate: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  total: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  payment_method: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  payment_last4: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  scanned_text: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  image_uri: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  storage: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  error_message: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updated_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  store: z.union([ z.lazy(() => StoreNullableScalarRelationFilterSchema), z.lazy(() => StoreWhereInputSchema) ]).optional().nullable(),
  items: z.lazy(() => ReceiptItemListRelationFilterSchema).optional(),
}));

export const ReceiptOrderByWithAggregationInputSchema: z.ZodType<Prisma.ReceiptOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  store_name_raw: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  receipt_date: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  currency_code: z.lazy(() => SortOrderSchema).optional(),
  subtotal: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  tax: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  tax_rate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  total: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  payment_method: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  payment_last4: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  scanned_text: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  image_uri: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  storage: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  error_message: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ReceiptCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ReceiptAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ReceiptMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ReceiptMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ReceiptSumOrderByAggregateInputSchema).optional(),
});

export const ReceiptScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ReceiptScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReceiptScalarWhereWithAggregatesInputSchema), z.lazy(() => ReceiptScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReceiptScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReceiptScalarWhereWithAggregatesInputSchema), z.lazy(() => ReceiptScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  user_id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  store_name_raw: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  receipt_date: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  currency_code: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  subtotal: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  tax: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  tax_rate: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  total: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  payment_method: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  payment_last4: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  scanned_text: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  image_uri: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  storage: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  error_message: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  created_at: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updated_at: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const ReceiptItemWhereInputSchema: z.ZodType<Prisma.ReceiptItemWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReceiptItemWhereInputSchema), z.lazy(() => ReceiptItemWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReceiptItemWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReceiptItemWhereInputSchema), z.lazy(() => ReceiptItemWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  receipt_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  line_number: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  original_text: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  product_name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  quantity: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unit: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  unit_price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  total_price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  matched: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  match_score: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  qdrant_collection: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  qdrant_point_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  subcategory: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  factor_unit: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  factor_source: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  factor_version: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  is_eco_flag: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  flags: z.lazy(() => JsonFilterSchema).optional(),
  receipt: z.union([ z.lazy(() => ReceiptScalarRelationFilterSchema), z.lazy(() => ReceiptWhereInputSchema) ]).optional(),
});

export const ReceiptItemOrderByWithRelationInputSchema: z.ZodType<Prisma.ReceiptItemOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  receipt_id: z.lazy(() => SortOrderSchema).optional(),
  line_number: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  original_text: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  product_name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  quantity: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  unit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  unit_price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  total_price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  matched: z.lazy(() => SortOrderSchema).optional(),
  match_score: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  qdrant_collection: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  qdrant_point_id: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  brand: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  category: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  subcategory: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  factor_co2_per_unit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  factor_unit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  factor_source: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  factor_version: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  is_eco_flag: z.lazy(() => SortOrderSchema).optional(),
  flags: z.lazy(() => SortOrderSchema).optional(),
  receipt: z.lazy(() => ReceiptOrderByWithRelationInputSchema).optional(),
});

export const ReceiptItemWhereUniqueInputSchema: z.ZodType<Prisma.ReceiptItemWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => ReceiptItemWhereInputSchema), z.lazy(() => ReceiptItemWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReceiptItemWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReceiptItemWhereInputSchema), z.lazy(() => ReceiptItemWhereInputSchema).array() ]).optional(),
  receipt_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  line_number: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  original_text: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  product_name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  quantity: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unit: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  unit_price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  total_price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  matched: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  match_score: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  qdrant_collection: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  qdrant_point_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  subcategory: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  factor_unit: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  factor_source: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  factor_version: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  is_eco_flag: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  flags: z.lazy(() => JsonFilterSchema).optional(),
  receipt: z.union([ z.lazy(() => ReceiptScalarRelationFilterSchema), z.lazy(() => ReceiptWhereInputSchema) ]).optional(),
}));

export const ReceiptItemOrderByWithAggregationInputSchema: z.ZodType<Prisma.ReceiptItemOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  receipt_id: z.lazy(() => SortOrderSchema).optional(),
  line_number: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  original_text: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  product_name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  quantity: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  unit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  unit_price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  total_price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  matched: z.lazy(() => SortOrderSchema).optional(),
  match_score: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  qdrant_collection: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  qdrant_point_id: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  brand: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  category: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  subcategory: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  factor_co2_per_unit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  factor_unit: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  factor_source: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  factor_version: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  is_eco_flag: z.lazy(() => SortOrderSchema).optional(),
  flags: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ReceiptItemCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ReceiptItemAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ReceiptItemMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ReceiptItemMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ReceiptItemSumOrderByAggregateInputSchema).optional(),
});

export const ReceiptItemScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ReceiptItemScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReceiptItemScalarWhereWithAggregatesInputSchema), z.lazy(() => ReceiptItemScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReceiptItemScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReceiptItemScalarWhereWithAggregatesInputSchema), z.lazy(() => ReceiptItemScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  receipt_id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  line_number: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  original_text: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  product_name: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  quantity: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unit: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  unit_price: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  total_price: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  matched: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  match_score: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  qdrant_collection: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  qdrant_point_id: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  subcategory: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.lazy(() => DecimalNullableWithAggregatesFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  factor_unit: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  factor_source: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  factor_version: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  is_eco_flag: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  flags: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
});

export const PromoWhereInputSchema: z.ZodType<Prisma.PromoWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PromoWhereInputSchema), z.lazy(() => PromoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PromoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PromoWhereInputSchema), z.lazy(() => PromoWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  promo_type: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  icon_name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  receipts_required: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  validity_start: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  validity_end: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  is_active: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  store: z.union([ z.lazy(() => StoreNullableScalarRelationFilterSchema), z.lazy(() => StoreWhereInputSchema) ]).optional().nullable(),
  userPromos: z.lazy(() => UserPromoListRelationFilterSchema).optional(),
});

export const PromoOrderByWithRelationInputSchema: z.ZodType<Prisma.PromoOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  promo_type: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  icon_name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  receipts_required: z.lazy(() => SortOrderSchema).optional(),
  validity_start: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  validity_end: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  is_active: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  store: z.lazy(() => StoreOrderByWithRelationInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoOrderByRelationAggregateInputSchema).optional(),
});

export const PromoWhereUniqueInputSchema: z.ZodType<Prisma.PromoWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => PromoWhereInputSchema), z.lazy(() => PromoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PromoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PromoWhereInputSchema), z.lazy(() => PromoWhereInputSchema).array() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  promo_type: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  icon_name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  receipts_required: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  validity_start: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  validity_end: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  is_active: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  store: z.union([ z.lazy(() => StoreNullableScalarRelationFilterSchema), z.lazy(() => StoreWhereInputSchema) ]).optional().nullable(),
  userPromos: z.lazy(() => UserPromoListRelationFilterSchema).optional(),
}));

export const PromoOrderByWithAggregationInputSchema: z.ZodType<Prisma.PromoOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  promo_type: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  icon_name: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  receipts_required: z.lazy(() => SortOrderSchema).optional(),
  validity_start: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  validity_end: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  is_active: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PromoCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PromoAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PromoMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PromoMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PromoSumOrderByAggregateInputSchema).optional(),
});

export const PromoScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PromoScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PromoScalarWhereWithAggregatesInputSchema), z.lazy(() => PromoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PromoScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PromoScalarWhereWithAggregatesInputSchema), z.lazy(() => PromoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  promo_type: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  icon_name: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  receipts_required: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  validity_start: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  validity_end: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  is_active: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  created_at: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const UserPromoWhereInputSchema: z.ZodType<Prisma.UserPromoWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserPromoWhereInputSchema), z.lazy(() => UserPromoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserPromoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserPromoWhereInputSchema), z.lazy(() => UserPromoWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  user_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  promo_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  is_available: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  redeemed_at: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  payload: z.lazy(() => JsonFilterSchema).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  promo: z.union([ z.lazy(() => PromoScalarRelationFilterSchema), z.lazy(() => PromoWhereInputSchema) ]).optional(),
});

export const UserPromoOrderByWithRelationInputSchema: z.ZodType<Prisma.UserPromoOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  promo_id: z.lazy(() => SortOrderSchema).optional(),
  is_available: z.lazy(() => SortOrderSchema).optional(),
  redeemed_at: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  payload: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  promo: z.lazy(() => PromoOrderByWithRelationInputSchema).optional(),
});

export const UserPromoWhereUniqueInputSchema: z.ZodType<Prisma.UserPromoWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    user_id_promo_id: z.lazy(() => UserPromoUser_idPromo_idCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    user_id_promo_id: z.lazy(() => UserPromoUser_idPromo_idCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  user_id_promo_id: z.lazy(() => UserPromoUser_idPromo_idCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => UserPromoWhereInputSchema), z.lazy(() => UserPromoWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserPromoWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserPromoWhereInputSchema), z.lazy(() => UserPromoWhereInputSchema).array() ]).optional(),
  user_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  promo_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  is_available: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  redeemed_at: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  payload: z.lazy(() => JsonFilterSchema).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  promo: z.union([ z.lazy(() => PromoScalarRelationFilterSchema), z.lazy(() => PromoWhereInputSchema) ]).optional(),
}));

export const UserPromoOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserPromoOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  promo_id: z.lazy(() => SortOrderSchema).optional(),
  is_available: z.lazy(() => SortOrderSchema).optional(),
  redeemed_at: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  payload: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserPromoCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserPromoMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserPromoMinOrderByAggregateInputSchema).optional(),
});

export const UserPromoScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserPromoScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserPromoScalarWhereWithAggregatesInputSchema), z.lazy(() => UserPromoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserPromoScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserPromoScalarWhereWithAggregatesInputSchema), z.lazy(() => UserPromoScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  user_id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  promo_id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  is_available: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  redeemed_at: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  payload: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
});

export const AuditEventWhereInputSchema: z.ZodType<Prisma.AuditEventWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AuditEventWhereInputSchema), z.lazy(() => AuditEventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AuditEventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AuditEventWhereInputSchema), z.lazy(() => AuditEventWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  user_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  entity: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  entity_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  action: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  data: z.lazy(() => JsonNullableFilterSchema).optional(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const AuditEventOrderByWithRelationInputSchema: z.ZodType<Prisma.AuditEventOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  entity: z.lazy(() => SortOrderSchema).optional(),
  entity_id: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  data: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
});

export const AuditEventWhereUniqueInputSchema: z.ZodType<Prisma.AuditEventWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => AuditEventWhereInputSchema), z.lazy(() => AuditEventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AuditEventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AuditEventWhereInputSchema), z.lazy(() => AuditEventWhereInputSchema).array() ]).optional(),
  user_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  entity: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  entity_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  action: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  data: z.lazy(() => JsonNullableFilterSchema).optional(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const AuditEventOrderByWithAggregationInputSchema: z.ZodType<Prisma.AuditEventOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  entity: z.lazy(() => SortOrderSchema).optional(),
  entity_id: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  data: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AuditEventCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AuditEventMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AuditEventMinOrderByAggregateInputSchema).optional(),
});

export const AuditEventScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AuditEventScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AuditEventScalarWhereWithAggregatesInputSchema), z.lazy(() => AuditEventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AuditEventScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AuditEventScalarWhereWithAggregatesInputSchema), z.lazy(() => AuditEventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  user_id: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  entity: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  entity_id: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  action: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  data: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  created_at: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  onboarding_completed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  preferences: z.lazy(() => UserPreferencesCreateNestedOneWithoutUserInputSchema).optional(),
  receipts: z.lazy(() => ReceiptCreateNestedManyWithoutUserInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  onboarding_completed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  preferences: z.lazy(() => UserPreferencesUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  receipts: z.lazy(() => ReceiptUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password_hash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  onboarding_completed: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  preferences: z.lazy(() => UserPreferencesUpdateOneWithoutUserNestedInputSchema).optional(),
  receipts: z.lazy(() => ReceiptUpdateManyWithoutUserNestedInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password_hash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  onboarding_completed: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  preferences: z.lazy(() => UserPreferencesUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  receipts: z.lazy(() => ReceiptUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  onboarding_completed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password_hash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  onboarding_completed: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password_hash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  onboarding_completed: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserPreferencesCreateInputSchema: z.ZodType<Prisma.UserPreferencesCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPreferencesInputSchema),
});

export const UserPreferencesUncheckedCreateInputSchema: z.ZodType<Prisma.UserPreferencesUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.coerce.date().optional(),
});

export const UserPreferencesUpdateInputSchema: z.ZodType<Prisma.UserPreferencesUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutPreferencesNestedInputSchema).optional(),
});

export const UserPreferencesUncheckedUpdateInputSchema: z.ZodType<Prisma.UserPreferencesUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserPreferencesCreateManyInputSchema: z.ZodType<Prisma.UserPreferencesCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.coerce.date().optional(),
});

export const UserPreferencesUpdateManyMutationInputSchema: z.ZodType<Prisma.UserPreferencesUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserPreferencesUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserPreferencesUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StoreCreateInputSchema: z.ZodType<Prisma.StoreCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  logo_path: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  receipts: z.lazy(() => ReceiptCreateNestedManyWithoutStoreInputSchema).optional(),
  promos: z.lazy(() => PromoCreateNestedManyWithoutStoreInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasCreateNestedManyWithoutStoreInputSchema).optional(),
});

export const StoreUncheckedCreateInputSchema: z.ZodType<Prisma.StoreUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  logo_path: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  receipts: z.lazy(() => ReceiptUncheckedCreateNestedManyWithoutStoreInputSchema).optional(),
  promos: z.lazy(() => PromoUncheckedCreateNestedManyWithoutStoreInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasUncheckedCreateNestedManyWithoutStoreInputSchema).optional(),
});

export const StoreUpdateInputSchema: z.ZodType<Prisma.StoreUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo_path: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  receipts: z.lazy(() => ReceiptUpdateManyWithoutStoreNestedInputSchema).optional(),
  promos: z.lazy(() => PromoUpdateManyWithoutStoreNestedInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasUpdateManyWithoutStoreNestedInputSchema).optional(),
});

export const StoreUncheckedUpdateInputSchema: z.ZodType<Prisma.StoreUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo_path: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  receipts: z.lazy(() => ReceiptUncheckedUpdateManyWithoutStoreNestedInputSchema).optional(),
  promos: z.lazy(() => PromoUncheckedUpdateManyWithoutStoreNestedInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasUncheckedUpdateManyWithoutStoreNestedInputSchema).optional(),
});

export const StoreCreateManyInputSchema: z.ZodType<Prisma.StoreCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  logo_path: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
});

export const StoreUpdateManyMutationInputSchema: z.ZodType<Prisma.StoreUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo_path: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StoreUncheckedUpdateManyInputSchema: z.ZodType<Prisma.StoreUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo_path: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StoreAliasCreateInputSchema: z.ZodType<Prisma.StoreAliasCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  alias: z.string(),
  store: z.lazy(() => StoreCreateNestedOneWithoutAliasesInputSchema),
});

export const StoreAliasUncheckedCreateInputSchema: z.ZodType<Prisma.StoreAliasUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  store_id: z.string(),
  alias: z.string(),
});

export const StoreAliasUpdateInputSchema: z.ZodType<Prisma.StoreAliasUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  alias: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store: z.lazy(() => StoreUpdateOneRequiredWithoutAliasesNestedInputSchema).optional(),
});

export const StoreAliasUncheckedUpdateInputSchema: z.ZodType<Prisma.StoreAliasUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  alias: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StoreAliasCreateManyInputSchema: z.ZodType<Prisma.StoreAliasCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  store_id: z.string(),
  alias: z.string(),
});

export const StoreAliasUpdateManyMutationInputSchema: z.ZodType<Prisma.StoreAliasUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  alias: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StoreAliasUncheckedUpdateManyInputSchema: z.ZodType<Prisma.StoreAliasUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  alias: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReceiptCreateInputSchema: z.ZodType<Prisma.ReceiptCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutReceiptsInputSchema),
  store: z.lazy(() => StoreCreateNestedOneWithoutReceiptsInputSchema).optional(),
  items: z.lazy(() => ReceiptItemCreateNestedManyWithoutReceiptInputSchema).optional(),
});

export const ReceiptUncheckedCreateInputSchema: z.ZodType<Prisma.ReceiptUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  store_id: z.string().optional().nullable(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  items: z.lazy(() => ReceiptItemUncheckedCreateNestedManyWithoutReceiptInputSchema).optional(),
});

export const ReceiptUpdateInputSchema: z.ZodType<Prisma.ReceiptUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutReceiptsNestedInputSchema).optional(),
  store: z.lazy(() => StoreUpdateOneWithoutReceiptsNestedInputSchema).optional(),
  items: z.lazy(() => ReceiptItemUpdateManyWithoutReceiptNestedInputSchema).optional(),
});

export const ReceiptUncheckedUpdateInputSchema: z.ZodType<Prisma.ReceiptUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  items: z.lazy(() => ReceiptItemUncheckedUpdateManyWithoutReceiptNestedInputSchema).optional(),
});

export const ReceiptCreateManyInputSchema: z.ZodType<Prisma.ReceiptCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  store_id: z.string().optional().nullable(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const ReceiptUpdateManyMutationInputSchema: z.ZodType<Prisma.ReceiptUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReceiptUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ReceiptUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReceiptItemCreateInputSchema: z.ZodType<Prisma.ReceiptItemCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  line_number: z.number().int().optional().nullable(),
  original_text: z.string().optional().nullable(),
  product_name: z.string().optional().nullable(),
  quantity: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unit: z.string().optional().nullable(),
  unit_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  matched: z.boolean().optional(),
  match_score: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  qdrant_collection: z.string().optional().nullable(),
  qdrant_point_id: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  factor_co2_per_unit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  factor_unit: z.string().optional().nullable(),
  factor_source: z.string().optional().nullable(),
  factor_version: z.string().optional().nullable(),
  is_eco_flag: z.boolean().optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  receipt: z.lazy(() => ReceiptCreateNestedOneWithoutItemsInputSchema),
});

export const ReceiptItemUncheckedCreateInputSchema: z.ZodType<Prisma.ReceiptItemUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  receipt_id: z.string(),
  line_number: z.number().int().optional().nullable(),
  original_text: z.string().optional().nullable(),
  product_name: z.string().optional().nullable(),
  quantity: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unit: z.string().optional().nullable(),
  unit_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  matched: z.boolean().optional(),
  match_score: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  qdrant_collection: z.string().optional().nullable(),
  qdrant_point_id: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  factor_co2_per_unit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  factor_unit: z.string().optional().nullable(),
  factor_source: z.string().optional().nullable(),
  factor_version: z.string().optional().nullable(),
  is_eco_flag: z.boolean().optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptItemUpdateInputSchema: z.ZodType<Prisma.ReceiptItemUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  line_number: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  original_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  product_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  quantity: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  matched: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  match_score: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_collection: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_point_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subcategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_source: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_version: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_eco_flag: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  receipt: z.lazy(() => ReceiptUpdateOneRequiredWithoutItemsNestedInputSchema).optional(),
});

export const ReceiptItemUncheckedUpdateInputSchema: z.ZodType<Prisma.ReceiptItemUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  receipt_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  line_number: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  original_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  product_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  quantity: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  matched: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  match_score: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_collection: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_point_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subcategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_source: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_version: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_eco_flag: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptItemCreateManyInputSchema: z.ZodType<Prisma.ReceiptItemCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  receipt_id: z.string(),
  line_number: z.number().int().optional().nullable(),
  original_text: z.string().optional().nullable(),
  product_name: z.string().optional().nullable(),
  quantity: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unit: z.string().optional().nullable(),
  unit_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  matched: z.boolean().optional(),
  match_score: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  qdrant_collection: z.string().optional().nullable(),
  qdrant_point_id: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  factor_co2_per_unit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  factor_unit: z.string().optional().nullable(),
  factor_source: z.string().optional().nullable(),
  factor_version: z.string().optional().nullable(),
  is_eco_flag: z.boolean().optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptItemUpdateManyMutationInputSchema: z.ZodType<Prisma.ReceiptItemUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  line_number: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  original_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  product_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  quantity: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  matched: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  match_score: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_collection: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_point_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subcategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_source: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_version: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_eco_flag: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptItemUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ReceiptItemUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  receipt_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  line_number: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  original_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  product_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  quantity: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  matched: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  match_score: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_collection: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_point_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subcategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_source: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_version: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_eco_flag: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const PromoCreateInputSchema: z.ZodType<Prisma.PromoCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  promo_type: z.string(),
  icon_name: z.string().optional().nullable(),
  receipts_required: z.number().int().optional(),
  validity_start: z.coerce.date().optional().nullable(),
  validity_end: z.coerce.date().optional().nullable(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  store: z.lazy(() => StoreCreateNestedOneWithoutPromosInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoCreateNestedManyWithoutPromoInputSchema).optional(),
});

export const PromoUncheckedCreateInputSchema: z.ZodType<Prisma.PromoUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  promo_type: z.string(),
  store_id: z.string().optional().nullable(),
  icon_name: z.string().optional().nullable(),
  receipts_required: z.number().int().optional(),
  validity_start: z.coerce.date().optional().nullable(),
  validity_end: z.coerce.date().optional().nullable(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  userPromos: z.lazy(() => UserPromoUncheckedCreateNestedManyWithoutPromoInputSchema).optional(),
});

export const PromoUpdateInputSchema: z.ZodType<Prisma.PromoUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  promo_type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipts_required: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validity_start: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validity_end: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_active: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  store: z.lazy(() => StoreUpdateOneWithoutPromosNestedInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoUpdateManyWithoutPromoNestedInputSchema).optional(),
});

export const PromoUncheckedUpdateInputSchema: z.ZodType<Prisma.PromoUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  promo_type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipts_required: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validity_start: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validity_end: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_active: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userPromos: z.lazy(() => UserPromoUncheckedUpdateManyWithoutPromoNestedInputSchema).optional(),
});

export const PromoCreateManyInputSchema: z.ZodType<Prisma.PromoCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  promo_type: z.string(),
  store_id: z.string().optional().nullable(),
  icon_name: z.string().optional().nullable(),
  receipts_required: z.number().int().optional(),
  validity_start: z.coerce.date().optional().nullable(),
  validity_end: z.coerce.date().optional().nullable(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
});

export const PromoUpdateManyMutationInputSchema: z.ZodType<Prisma.PromoUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  promo_type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipts_required: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validity_start: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validity_end: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_active: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PromoUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PromoUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  promo_type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipts_required: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validity_start: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validity_end: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_active: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserPromoCreateInputSchema: z.ZodType<Prisma.UserPromoCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  is_available: z.boolean().optional(),
  redeemed_at: z.coerce.date().optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutUserPromosInputSchema),
  promo: z.lazy(() => PromoCreateNestedOneWithoutUserPromosInputSchema),
});

export const UserPromoUncheckedCreateInputSchema: z.ZodType<Prisma.UserPromoUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  promo_id: z.string(),
  is_available: z.boolean().optional(),
  redeemed_at: z.coerce.date().optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const UserPromoUpdateInputSchema: z.ZodType<Prisma.UserPromoUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  is_available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  redeemed_at: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutUserPromosNestedInputSchema).optional(),
  promo: z.lazy(() => PromoUpdateOneRequiredWithoutUserPromosNestedInputSchema).optional(),
});

export const UserPromoUncheckedUpdateInputSchema: z.ZodType<Prisma.UserPromoUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  promo_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  is_available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  redeemed_at: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const UserPromoCreateManyInputSchema: z.ZodType<Prisma.UserPromoCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  promo_id: z.string(),
  is_available: z.boolean().optional(),
  redeemed_at: z.coerce.date().optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const UserPromoUpdateManyMutationInputSchema: z.ZodType<Prisma.UserPromoUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  is_available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  redeemed_at: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const UserPromoUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserPromoUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  promo_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  is_available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  redeemed_at: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const AuditEventCreateInputSchema: z.ZodType<Prisma.AuditEventCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string().optional().nullable(),
  entity: z.string(),
  entity_id: z.string().optional().nullable(),
  action: z.string(),
  data: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  created_at: z.coerce.date().optional(),
});

export const AuditEventUncheckedCreateInputSchema: z.ZodType<Prisma.AuditEventUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string().optional().nullable(),
  entity: z.string(),
  entity_id: z.string().optional().nullable(),
  action: z.string(),
  data: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  created_at: z.coerce.date().optional(),
});

export const AuditEventUpdateInputSchema: z.ZodType<Prisma.AuditEventUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  entity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  entity_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  data: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AuditEventUncheckedUpdateInputSchema: z.ZodType<Prisma.AuditEventUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  entity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  entity_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  data: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AuditEventCreateManyInputSchema: z.ZodType<Prisma.AuditEventCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string().optional().nullable(),
  entity: z.string(),
  entity_id: z.string().optional().nullable(),
  action: z.string(),
  data: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  created_at: z.coerce.date().optional(),
});

export const AuditEventUpdateManyMutationInputSchema: z.ZodType<Prisma.AuditEventUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  entity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  entity_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  data: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AuditEventUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AuditEventUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  entity: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  entity_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  data: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const UserPreferencesNullableScalarRelationFilterSchema: z.ZodType<Prisma.UserPreferencesNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => UserPreferencesWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => UserPreferencesWhereInputSchema).optional().nullable(),
});

export const ReceiptListRelationFilterSchema: z.ZodType<Prisma.ReceiptListRelationFilter> = z.strictObject({
  every: z.lazy(() => ReceiptWhereInputSchema).optional(),
  some: z.lazy(() => ReceiptWhereInputSchema).optional(),
  none: z.lazy(() => ReceiptWhereInputSchema).optional(),
});

export const UserPromoListRelationFilterSchema: z.ZodType<Prisma.UserPromoListRelationFilter> = z.strictObject({
  every: z.lazy(() => UserPromoWhereInputSchema).optional(),
  some: z.lazy(() => UserPromoWhereInputSchema).optional(),
  none: z.lazy(() => UserPromoWhereInputSchema).optional(),
});

export const ReceiptOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ReceiptOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const UserPromoOrderByRelationAggregateInputSchema: z.ZodType<Prisma.UserPromoOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  password_hash: z.lazy(() => SortOrderSchema).optional(),
  onboarding_completed: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  password_hash: z.lazy(() => SortOrderSchema).optional(),
  onboarding_completed: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  password_hash: z.lazy(() => SortOrderSchema).optional(),
  onboarding_completed: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
});

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const JsonFilterSchema: z.ZodType<Prisma.JsonFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => UserWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserPreferencesCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserPreferencesCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  goals: z.lazy(() => SortOrderSchema).optional(),
  lifestyles: z.lazy(() => SortOrderSchema).optional(),
  ingredients_to_avoid: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
});

export const UserPreferencesMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserPreferencesMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
});

export const UserPreferencesMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserPreferencesMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
});

export const JsonWithAggregatesFilterSchema: z.ZodType<Prisma.JsonWithAggregatesFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonFilterSchema).optional(),
});

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const PromoListRelationFilterSchema: z.ZodType<Prisma.PromoListRelationFilter> = z.strictObject({
  every: z.lazy(() => PromoWhereInputSchema).optional(),
  some: z.lazy(() => PromoWhereInputSchema).optional(),
  none: z.lazy(() => PromoWhereInputSchema).optional(),
});

export const StoreAliasListRelationFilterSchema: z.ZodType<Prisma.StoreAliasListRelationFilter> = z.strictObject({
  every: z.lazy(() => StoreAliasWhereInputSchema).optional(),
  some: z.lazy(() => StoreAliasWhereInputSchema).optional(),
  none: z.lazy(() => StoreAliasWhereInputSchema).optional(),
});

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const PromoOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PromoOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const StoreAliasOrderByRelationAggregateInputSchema: z.ZodType<Prisma.StoreAliasOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const StoreCountOrderByAggregateInputSchema: z.ZodType<Prisma.StoreCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  logo_path: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
});

export const StoreMaxOrderByAggregateInputSchema: z.ZodType<Prisma.StoreMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  logo_path: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
});

export const StoreMinOrderByAggregateInputSchema: z.ZodType<Prisma.StoreMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  logo_path: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
});

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const StoreScalarRelationFilterSchema: z.ZodType<Prisma.StoreScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => StoreWhereInputSchema).optional(),
  isNot: z.lazy(() => StoreWhereInputSchema).optional(),
});

export const StoreAliasCountOrderByAggregateInputSchema: z.ZodType<Prisma.StoreAliasCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  alias: z.lazy(() => SortOrderSchema).optional(),
});

export const StoreAliasMaxOrderByAggregateInputSchema: z.ZodType<Prisma.StoreAliasMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  alias: z.lazy(() => SortOrderSchema).optional(),
});

export const StoreAliasMinOrderByAggregateInputSchema: z.ZodType<Prisma.StoreAliasMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  alias: z.lazy(() => SortOrderSchema).optional(),
});

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const DecimalNullableFilterSchema: z.ZodType<Prisma.DecimalNullableFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableFilterSchema) ]).optional().nullable(),
});

export const StoreNullableScalarRelationFilterSchema: z.ZodType<Prisma.StoreNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => StoreWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => StoreWhereInputSchema).optional().nullable(),
});

export const ReceiptItemListRelationFilterSchema: z.ZodType<Prisma.ReceiptItemListRelationFilter> = z.strictObject({
  every: z.lazy(() => ReceiptItemWhereInputSchema).optional(),
  some: z.lazy(() => ReceiptItemWhereInputSchema).optional(),
  none: z.lazy(() => ReceiptItemWhereInputSchema).optional(),
});

export const ReceiptItemOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ReceiptItemOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const ReceiptCountOrderByAggregateInputSchema: z.ZodType<Prisma.ReceiptCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  store_name_raw: z.lazy(() => SortOrderSchema).optional(),
  receipt_date: z.lazy(() => SortOrderSchema).optional(),
  currency_code: z.lazy(() => SortOrderSchema).optional(),
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  tax_rate: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  payment_method: z.lazy(() => SortOrderSchema).optional(),
  payment_last4: z.lazy(() => SortOrderSchema).optional(),
  scanned_text: z.lazy(() => SortOrderSchema).optional(),
  image_uri: z.lazy(() => SortOrderSchema).optional(),
  storage: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  error_message: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
});

export const ReceiptAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ReceiptAvgOrderByAggregateInput> = z.strictObject({
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  tax_rate: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
});

export const ReceiptMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ReceiptMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  store_name_raw: z.lazy(() => SortOrderSchema).optional(),
  receipt_date: z.lazy(() => SortOrderSchema).optional(),
  currency_code: z.lazy(() => SortOrderSchema).optional(),
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  tax_rate: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  payment_method: z.lazy(() => SortOrderSchema).optional(),
  payment_last4: z.lazy(() => SortOrderSchema).optional(),
  scanned_text: z.lazy(() => SortOrderSchema).optional(),
  image_uri: z.lazy(() => SortOrderSchema).optional(),
  storage: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  error_message: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
});

export const ReceiptMinOrderByAggregateInputSchema: z.ZodType<Prisma.ReceiptMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  store_name_raw: z.lazy(() => SortOrderSchema).optional(),
  receipt_date: z.lazy(() => SortOrderSchema).optional(),
  currency_code: z.lazy(() => SortOrderSchema).optional(),
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  tax_rate: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  payment_method: z.lazy(() => SortOrderSchema).optional(),
  payment_last4: z.lazy(() => SortOrderSchema).optional(),
  scanned_text: z.lazy(() => SortOrderSchema).optional(),
  image_uri: z.lazy(() => SortOrderSchema).optional(),
  storage: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  error_message: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
  updated_at: z.lazy(() => SortOrderSchema).optional(),
});

export const ReceiptSumOrderByAggregateInputSchema: z.ZodType<Prisma.ReceiptSumOrderByAggregateInput> = z.strictObject({
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  tax_rate: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
});

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const DecimalNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DecimalNullableWithAggregatesFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
});

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const ReceiptScalarRelationFilterSchema: z.ZodType<Prisma.ReceiptScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => ReceiptWhereInputSchema).optional(),
  isNot: z.lazy(() => ReceiptWhereInputSchema).optional(),
});

export const ReceiptItemCountOrderByAggregateInputSchema: z.ZodType<Prisma.ReceiptItemCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  receipt_id: z.lazy(() => SortOrderSchema).optional(),
  line_number: z.lazy(() => SortOrderSchema).optional(),
  original_text: z.lazy(() => SortOrderSchema).optional(),
  product_name: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unit: z.lazy(() => SortOrderSchema).optional(),
  unit_price: z.lazy(() => SortOrderSchema).optional(),
  total_price: z.lazy(() => SortOrderSchema).optional(),
  matched: z.lazy(() => SortOrderSchema).optional(),
  match_score: z.lazy(() => SortOrderSchema).optional(),
  qdrant_collection: z.lazy(() => SortOrderSchema).optional(),
  qdrant_point_id: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  subcategory: z.lazy(() => SortOrderSchema).optional(),
  factor_co2_per_unit: z.lazy(() => SortOrderSchema).optional(),
  factor_unit: z.lazy(() => SortOrderSchema).optional(),
  factor_source: z.lazy(() => SortOrderSchema).optional(),
  factor_version: z.lazy(() => SortOrderSchema).optional(),
  is_eco_flag: z.lazy(() => SortOrderSchema).optional(),
  flags: z.lazy(() => SortOrderSchema).optional(),
});

export const ReceiptItemAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ReceiptItemAvgOrderByAggregateInput> = z.strictObject({
  line_number: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unit_price: z.lazy(() => SortOrderSchema).optional(),
  total_price: z.lazy(() => SortOrderSchema).optional(),
  match_score: z.lazy(() => SortOrderSchema).optional(),
  factor_co2_per_unit: z.lazy(() => SortOrderSchema).optional(),
});

export const ReceiptItemMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ReceiptItemMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  receipt_id: z.lazy(() => SortOrderSchema).optional(),
  line_number: z.lazy(() => SortOrderSchema).optional(),
  original_text: z.lazy(() => SortOrderSchema).optional(),
  product_name: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unit: z.lazy(() => SortOrderSchema).optional(),
  unit_price: z.lazy(() => SortOrderSchema).optional(),
  total_price: z.lazy(() => SortOrderSchema).optional(),
  matched: z.lazy(() => SortOrderSchema).optional(),
  match_score: z.lazy(() => SortOrderSchema).optional(),
  qdrant_collection: z.lazy(() => SortOrderSchema).optional(),
  qdrant_point_id: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  subcategory: z.lazy(() => SortOrderSchema).optional(),
  factor_co2_per_unit: z.lazy(() => SortOrderSchema).optional(),
  factor_unit: z.lazy(() => SortOrderSchema).optional(),
  factor_source: z.lazy(() => SortOrderSchema).optional(),
  factor_version: z.lazy(() => SortOrderSchema).optional(),
  is_eco_flag: z.lazy(() => SortOrderSchema).optional(),
});

export const ReceiptItemMinOrderByAggregateInputSchema: z.ZodType<Prisma.ReceiptItemMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  receipt_id: z.lazy(() => SortOrderSchema).optional(),
  line_number: z.lazy(() => SortOrderSchema).optional(),
  original_text: z.lazy(() => SortOrderSchema).optional(),
  product_name: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unit: z.lazy(() => SortOrderSchema).optional(),
  unit_price: z.lazy(() => SortOrderSchema).optional(),
  total_price: z.lazy(() => SortOrderSchema).optional(),
  matched: z.lazy(() => SortOrderSchema).optional(),
  match_score: z.lazy(() => SortOrderSchema).optional(),
  qdrant_collection: z.lazy(() => SortOrderSchema).optional(),
  qdrant_point_id: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  subcategory: z.lazy(() => SortOrderSchema).optional(),
  factor_co2_per_unit: z.lazy(() => SortOrderSchema).optional(),
  factor_unit: z.lazy(() => SortOrderSchema).optional(),
  factor_source: z.lazy(() => SortOrderSchema).optional(),
  factor_version: z.lazy(() => SortOrderSchema).optional(),
  is_eco_flag: z.lazy(() => SortOrderSchema).optional(),
});

export const ReceiptItemSumOrderByAggregateInputSchema: z.ZodType<Prisma.ReceiptItemSumOrderByAggregateInput> = z.strictObject({
  line_number: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unit_price: z.lazy(() => SortOrderSchema).optional(),
  total_price: z.lazy(() => SortOrderSchema).optional(),
  match_score: z.lazy(() => SortOrderSchema).optional(),
  factor_co2_per_unit: z.lazy(() => SortOrderSchema).optional(),
});

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const PromoCountOrderByAggregateInputSchema: z.ZodType<Prisma.PromoCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  promo_type: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  icon_name: z.lazy(() => SortOrderSchema).optional(),
  receipts_required: z.lazy(() => SortOrderSchema).optional(),
  validity_start: z.lazy(() => SortOrderSchema).optional(),
  validity_end: z.lazy(() => SortOrderSchema).optional(),
  is_active: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
});

export const PromoAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PromoAvgOrderByAggregateInput> = z.strictObject({
  receipts_required: z.lazy(() => SortOrderSchema).optional(),
});

export const PromoMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PromoMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  promo_type: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  icon_name: z.lazy(() => SortOrderSchema).optional(),
  receipts_required: z.lazy(() => SortOrderSchema).optional(),
  validity_start: z.lazy(() => SortOrderSchema).optional(),
  validity_end: z.lazy(() => SortOrderSchema).optional(),
  is_active: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
});

export const PromoMinOrderByAggregateInputSchema: z.ZodType<Prisma.PromoMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  promo_type: z.lazy(() => SortOrderSchema).optional(),
  store_id: z.lazy(() => SortOrderSchema).optional(),
  icon_name: z.lazy(() => SortOrderSchema).optional(),
  receipts_required: z.lazy(() => SortOrderSchema).optional(),
  validity_start: z.lazy(() => SortOrderSchema).optional(),
  validity_end: z.lazy(() => SortOrderSchema).optional(),
  is_active: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
});

export const PromoSumOrderByAggregateInputSchema: z.ZodType<Prisma.PromoSumOrderByAggregateInput> = z.strictObject({
  receipts_required: z.lazy(() => SortOrderSchema).optional(),
});

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const PromoScalarRelationFilterSchema: z.ZodType<Prisma.PromoScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => PromoWhereInputSchema).optional(),
  isNot: z.lazy(() => PromoWhereInputSchema).optional(),
});

export const UserPromoUser_idPromo_idCompoundUniqueInputSchema: z.ZodType<Prisma.UserPromoUser_idPromo_idCompoundUniqueInput> = z.strictObject({
  user_id: z.string(),
  promo_id: z.string(),
});

export const UserPromoCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserPromoCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  promo_id: z.lazy(() => SortOrderSchema).optional(),
  is_available: z.lazy(() => SortOrderSchema).optional(),
  redeemed_at: z.lazy(() => SortOrderSchema).optional(),
  payload: z.lazy(() => SortOrderSchema).optional(),
});

export const UserPromoMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserPromoMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  promo_id: z.lazy(() => SortOrderSchema).optional(),
  is_available: z.lazy(() => SortOrderSchema).optional(),
  redeemed_at: z.lazy(() => SortOrderSchema).optional(),
});

export const UserPromoMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserPromoMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  promo_id: z.lazy(() => SortOrderSchema).optional(),
  is_available: z.lazy(() => SortOrderSchema).optional(),
  redeemed_at: z.lazy(() => SortOrderSchema).optional(),
});

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const AuditEventCountOrderByAggregateInputSchema: z.ZodType<Prisma.AuditEventCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  entity: z.lazy(() => SortOrderSchema).optional(),
  entity_id: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  data: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
});

export const AuditEventMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AuditEventMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  entity: z.lazy(() => SortOrderSchema).optional(),
  entity_id: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
});

export const AuditEventMinOrderByAggregateInputSchema: z.ZodType<Prisma.AuditEventMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  user_id: z.lazy(() => SortOrderSchema).optional(),
  entity: z.lazy(() => SortOrderSchema).optional(),
  entity_id: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  created_at: z.lazy(() => SortOrderSchema).optional(),
});

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
});

export const UserPreferencesCreateNestedOneWithoutUserInputSchema: z.ZodType<Prisma.UserPreferencesCreateNestedOneWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPreferencesCreateWithoutUserInputSchema), z.lazy(() => UserPreferencesUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserPreferencesCreateOrConnectWithoutUserInputSchema).optional(),
  connect: z.lazy(() => UserPreferencesWhereUniqueInputSchema).optional(),
});

export const ReceiptCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.ReceiptCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptCreateWithoutUserInputSchema), z.lazy(() => ReceiptCreateWithoutUserInputSchema).array(), z.lazy(() => ReceiptUncheckedCreateWithoutUserInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptCreateOrConnectWithoutUserInputSchema), z.lazy(() => ReceiptCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
});

export const UserPromoCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.UserPromoCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPromoCreateWithoutUserInputSchema), z.lazy(() => UserPromoCreateWithoutUserInputSchema).array(), z.lazy(() => UserPromoUncheckedCreateWithoutUserInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserPromoCreateOrConnectWithoutUserInputSchema), z.lazy(() => UserPromoCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserPromoCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
});

export const UserPreferencesUncheckedCreateNestedOneWithoutUserInputSchema: z.ZodType<Prisma.UserPreferencesUncheckedCreateNestedOneWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPreferencesCreateWithoutUserInputSchema), z.lazy(() => UserPreferencesUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserPreferencesCreateOrConnectWithoutUserInputSchema).optional(),
  connect: z.lazy(() => UserPreferencesWhereUniqueInputSchema).optional(),
});

export const ReceiptUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.ReceiptUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptCreateWithoutUserInputSchema), z.lazy(() => ReceiptCreateWithoutUserInputSchema).array(), z.lazy(() => ReceiptUncheckedCreateWithoutUserInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptCreateOrConnectWithoutUserInputSchema), z.lazy(() => ReceiptCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
});

export const UserPromoUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.UserPromoUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPromoCreateWithoutUserInputSchema), z.lazy(() => UserPromoCreateWithoutUserInputSchema).array(), z.lazy(() => UserPromoUncheckedCreateWithoutUserInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserPromoCreateOrConnectWithoutUserInputSchema), z.lazy(() => UserPromoCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserPromoCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
});

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
});

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
});

export const UserPreferencesUpdateOneWithoutUserNestedInputSchema: z.ZodType<Prisma.UserPreferencesUpdateOneWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPreferencesCreateWithoutUserInputSchema), z.lazy(() => UserPreferencesUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserPreferencesCreateOrConnectWithoutUserInputSchema).optional(),
  upsert: z.lazy(() => UserPreferencesUpsertWithoutUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserPreferencesWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserPreferencesWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserPreferencesWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserPreferencesUpdateToOneWithWhereWithoutUserInputSchema), z.lazy(() => UserPreferencesUpdateWithoutUserInputSchema), z.lazy(() => UserPreferencesUncheckedUpdateWithoutUserInputSchema) ]).optional(),
});

export const ReceiptUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.ReceiptUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptCreateWithoutUserInputSchema), z.lazy(() => ReceiptCreateWithoutUserInputSchema).array(), z.lazy(() => ReceiptUncheckedCreateWithoutUserInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptCreateOrConnectWithoutUserInputSchema), z.lazy(() => ReceiptCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReceiptUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => ReceiptUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReceiptUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => ReceiptUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReceiptUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => ReceiptUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReceiptScalarWhereInputSchema), z.lazy(() => ReceiptScalarWhereInputSchema).array() ]).optional(),
});

export const UserPromoUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.UserPromoUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPromoCreateWithoutUserInputSchema), z.lazy(() => UserPromoCreateWithoutUserInputSchema).array(), z.lazy(() => UserPromoUncheckedCreateWithoutUserInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserPromoCreateOrConnectWithoutUserInputSchema), z.lazy(() => UserPromoCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserPromoUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => UserPromoUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserPromoCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserPromoUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => UserPromoUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserPromoUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => UserPromoUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserPromoScalarWhereInputSchema), z.lazy(() => UserPromoScalarWhereInputSchema).array() ]).optional(),
});

export const UserPreferencesUncheckedUpdateOneWithoutUserNestedInputSchema: z.ZodType<Prisma.UserPreferencesUncheckedUpdateOneWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPreferencesCreateWithoutUserInputSchema), z.lazy(() => UserPreferencesUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserPreferencesCreateOrConnectWithoutUserInputSchema).optional(),
  upsert: z.lazy(() => UserPreferencesUpsertWithoutUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserPreferencesWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserPreferencesWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserPreferencesWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserPreferencesUpdateToOneWithWhereWithoutUserInputSchema), z.lazy(() => UserPreferencesUpdateWithoutUserInputSchema), z.lazy(() => UserPreferencesUncheckedUpdateWithoutUserInputSchema) ]).optional(),
});

export const ReceiptUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.ReceiptUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptCreateWithoutUserInputSchema), z.lazy(() => ReceiptCreateWithoutUserInputSchema).array(), z.lazy(() => ReceiptUncheckedCreateWithoutUserInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptCreateOrConnectWithoutUserInputSchema), z.lazy(() => ReceiptCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReceiptUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => ReceiptUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReceiptUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => ReceiptUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReceiptUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => ReceiptUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReceiptScalarWhereInputSchema), z.lazy(() => ReceiptScalarWhereInputSchema).array() ]).optional(),
});

export const UserPromoUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.UserPromoUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPromoCreateWithoutUserInputSchema), z.lazy(() => UserPromoCreateWithoutUserInputSchema).array(), z.lazy(() => UserPromoUncheckedCreateWithoutUserInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserPromoCreateOrConnectWithoutUserInputSchema), z.lazy(() => UserPromoCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserPromoUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => UserPromoUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserPromoCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserPromoUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => UserPromoUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserPromoUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => UserPromoUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserPromoScalarWhereInputSchema), z.lazy(() => UserPromoScalarWhereInputSchema).array() ]).optional(),
});

export const UserCreateNestedOneWithoutPreferencesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutPreferencesInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutPreferencesInputSchema), z.lazy(() => UserUncheckedCreateWithoutPreferencesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutPreferencesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const UserUpdateOneRequiredWithoutPreferencesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutPreferencesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutPreferencesInputSchema), z.lazy(() => UserUncheckedCreateWithoutPreferencesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutPreferencesInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutPreferencesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutPreferencesInputSchema), z.lazy(() => UserUpdateWithoutPreferencesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutPreferencesInputSchema) ]).optional(),
});

export const ReceiptCreateNestedManyWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptCreateNestedManyWithoutStoreInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptCreateWithoutStoreInputSchema), z.lazy(() => ReceiptCreateWithoutStoreInputSchema).array(), z.lazy(() => ReceiptUncheckedCreateWithoutStoreInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptCreateOrConnectWithoutStoreInputSchema), z.lazy(() => ReceiptCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptCreateManyStoreInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
});

export const PromoCreateNestedManyWithoutStoreInputSchema: z.ZodType<Prisma.PromoCreateNestedManyWithoutStoreInput> = z.strictObject({
  create: z.union([ z.lazy(() => PromoCreateWithoutStoreInputSchema), z.lazy(() => PromoCreateWithoutStoreInputSchema).array(), z.lazy(() => PromoUncheckedCreateWithoutStoreInputSchema), z.lazy(() => PromoUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PromoCreateOrConnectWithoutStoreInputSchema), z.lazy(() => PromoCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PromoCreateManyStoreInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PromoWhereUniqueInputSchema), z.lazy(() => PromoWhereUniqueInputSchema).array() ]).optional(),
});

export const StoreAliasCreateNestedManyWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasCreateNestedManyWithoutStoreInput> = z.strictObject({
  create: z.union([ z.lazy(() => StoreAliasCreateWithoutStoreInputSchema), z.lazy(() => StoreAliasCreateWithoutStoreInputSchema).array(), z.lazy(() => StoreAliasUncheckedCreateWithoutStoreInputSchema), z.lazy(() => StoreAliasUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StoreAliasCreateOrConnectWithoutStoreInputSchema), z.lazy(() => StoreAliasCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StoreAliasCreateManyStoreInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => StoreAliasWhereUniqueInputSchema), z.lazy(() => StoreAliasWhereUniqueInputSchema).array() ]).optional(),
});

export const ReceiptUncheckedCreateNestedManyWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptUncheckedCreateNestedManyWithoutStoreInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptCreateWithoutStoreInputSchema), z.lazy(() => ReceiptCreateWithoutStoreInputSchema).array(), z.lazy(() => ReceiptUncheckedCreateWithoutStoreInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptCreateOrConnectWithoutStoreInputSchema), z.lazy(() => ReceiptCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptCreateManyStoreInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
});

export const PromoUncheckedCreateNestedManyWithoutStoreInputSchema: z.ZodType<Prisma.PromoUncheckedCreateNestedManyWithoutStoreInput> = z.strictObject({
  create: z.union([ z.lazy(() => PromoCreateWithoutStoreInputSchema), z.lazy(() => PromoCreateWithoutStoreInputSchema).array(), z.lazy(() => PromoUncheckedCreateWithoutStoreInputSchema), z.lazy(() => PromoUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PromoCreateOrConnectWithoutStoreInputSchema), z.lazy(() => PromoCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PromoCreateManyStoreInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PromoWhereUniqueInputSchema), z.lazy(() => PromoWhereUniqueInputSchema).array() ]).optional(),
});

export const StoreAliasUncheckedCreateNestedManyWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasUncheckedCreateNestedManyWithoutStoreInput> = z.strictObject({
  create: z.union([ z.lazy(() => StoreAliasCreateWithoutStoreInputSchema), z.lazy(() => StoreAliasCreateWithoutStoreInputSchema).array(), z.lazy(() => StoreAliasUncheckedCreateWithoutStoreInputSchema), z.lazy(() => StoreAliasUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StoreAliasCreateOrConnectWithoutStoreInputSchema), z.lazy(() => StoreAliasCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StoreAliasCreateManyStoreInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => StoreAliasWhereUniqueInputSchema), z.lazy(() => StoreAliasWhereUniqueInputSchema).array() ]).optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const ReceiptUpdateManyWithoutStoreNestedInputSchema: z.ZodType<Prisma.ReceiptUpdateManyWithoutStoreNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptCreateWithoutStoreInputSchema), z.lazy(() => ReceiptCreateWithoutStoreInputSchema).array(), z.lazy(() => ReceiptUncheckedCreateWithoutStoreInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptCreateOrConnectWithoutStoreInputSchema), z.lazy(() => ReceiptCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReceiptUpsertWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => ReceiptUpsertWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptCreateManyStoreInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReceiptUpdateWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => ReceiptUpdateWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReceiptUpdateManyWithWhereWithoutStoreInputSchema), z.lazy(() => ReceiptUpdateManyWithWhereWithoutStoreInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReceiptScalarWhereInputSchema), z.lazy(() => ReceiptScalarWhereInputSchema).array() ]).optional(),
});

export const PromoUpdateManyWithoutStoreNestedInputSchema: z.ZodType<Prisma.PromoUpdateManyWithoutStoreNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PromoCreateWithoutStoreInputSchema), z.lazy(() => PromoCreateWithoutStoreInputSchema).array(), z.lazy(() => PromoUncheckedCreateWithoutStoreInputSchema), z.lazy(() => PromoUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PromoCreateOrConnectWithoutStoreInputSchema), z.lazy(() => PromoCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PromoUpsertWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => PromoUpsertWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PromoCreateManyStoreInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PromoWhereUniqueInputSchema), z.lazy(() => PromoWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PromoWhereUniqueInputSchema), z.lazy(() => PromoWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PromoWhereUniqueInputSchema), z.lazy(() => PromoWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PromoWhereUniqueInputSchema), z.lazy(() => PromoWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PromoUpdateWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => PromoUpdateWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PromoUpdateManyWithWhereWithoutStoreInputSchema), z.lazy(() => PromoUpdateManyWithWhereWithoutStoreInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PromoScalarWhereInputSchema), z.lazy(() => PromoScalarWhereInputSchema).array() ]).optional(),
});

export const StoreAliasUpdateManyWithoutStoreNestedInputSchema: z.ZodType<Prisma.StoreAliasUpdateManyWithoutStoreNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => StoreAliasCreateWithoutStoreInputSchema), z.lazy(() => StoreAliasCreateWithoutStoreInputSchema).array(), z.lazy(() => StoreAliasUncheckedCreateWithoutStoreInputSchema), z.lazy(() => StoreAliasUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StoreAliasCreateOrConnectWithoutStoreInputSchema), z.lazy(() => StoreAliasCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => StoreAliasUpsertWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => StoreAliasUpsertWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StoreAliasCreateManyStoreInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => StoreAliasWhereUniqueInputSchema), z.lazy(() => StoreAliasWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => StoreAliasWhereUniqueInputSchema), z.lazy(() => StoreAliasWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => StoreAliasWhereUniqueInputSchema), z.lazy(() => StoreAliasWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => StoreAliasWhereUniqueInputSchema), z.lazy(() => StoreAliasWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => StoreAliasUpdateWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => StoreAliasUpdateWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => StoreAliasUpdateManyWithWhereWithoutStoreInputSchema), z.lazy(() => StoreAliasUpdateManyWithWhereWithoutStoreInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => StoreAliasScalarWhereInputSchema), z.lazy(() => StoreAliasScalarWhereInputSchema).array() ]).optional(),
});

export const ReceiptUncheckedUpdateManyWithoutStoreNestedInputSchema: z.ZodType<Prisma.ReceiptUncheckedUpdateManyWithoutStoreNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptCreateWithoutStoreInputSchema), z.lazy(() => ReceiptCreateWithoutStoreInputSchema).array(), z.lazy(() => ReceiptUncheckedCreateWithoutStoreInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptCreateOrConnectWithoutStoreInputSchema), z.lazy(() => ReceiptCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReceiptUpsertWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => ReceiptUpsertWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptCreateManyStoreInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReceiptWhereUniqueInputSchema), z.lazy(() => ReceiptWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReceiptUpdateWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => ReceiptUpdateWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReceiptUpdateManyWithWhereWithoutStoreInputSchema), z.lazy(() => ReceiptUpdateManyWithWhereWithoutStoreInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReceiptScalarWhereInputSchema), z.lazy(() => ReceiptScalarWhereInputSchema).array() ]).optional(),
});

export const PromoUncheckedUpdateManyWithoutStoreNestedInputSchema: z.ZodType<Prisma.PromoUncheckedUpdateManyWithoutStoreNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PromoCreateWithoutStoreInputSchema), z.lazy(() => PromoCreateWithoutStoreInputSchema).array(), z.lazy(() => PromoUncheckedCreateWithoutStoreInputSchema), z.lazy(() => PromoUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PromoCreateOrConnectWithoutStoreInputSchema), z.lazy(() => PromoCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PromoUpsertWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => PromoUpsertWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PromoCreateManyStoreInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PromoWhereUniqueInputSchema), z.lazy(() => PromoWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PromoWhereUniqueInputSchema), z.lazy(() => PromoWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PromoWhereUniqueInputSchema), z.lazy(() => PromoWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PromoWhereUniqueInputSchema), z.lazy(() => PromoWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PromoUpdateWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => PromoUpdateWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PromoUpdateManyWithWhereWithoutStoreInputSchema), z.lazy(() => PromoUpdateManyWithWhereWithoutStoreInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PromoScalarWhereInputSchema), z.lazy(() => PromoScalarWhereInputSchema).array() ]).optional(),
});

export const StoreAliasUncheckedUpdateManyWithoutStoreNestedInputSchema: z.ZodType<Prisma.StoreAliasUncheckedUpdateManyWithoutStoreNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => StoreAliasCreateWithoutStoreInputSchema), z.lazy(() => StoreAliasCreateWithoutStoreInputSchema).array(), z.lazy(() => StoreAliasUncheckedCreateWithoutStoreInputSchema), z.lazy(() => StoreAliasUncheckedCreateWithoutStoreInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => StoreAliasCreateOrConnectWithoutStoreInputSchema), z.lazy(() => StoreAliasCreateOrConnectWithoutStoreInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => StoreAliasUpsertWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => StoreAliasUpsertWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  createMany: z.lazy(() => StoreAliasCreateManyStoreInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => StoreAliasWhereUniqueInputSchema), z.lazy(() => StoreAliasWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => StoreAliasWhereUniqueInputSchema), z.lazy(() => StoreAliasWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => StoreAliasWhereUniqueInputSchema), z.lazy(() => StoreAliasWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => StoreAliasWhereUniqueInputSchema), z.lazy(() => StoreAliasWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => StoreAliasUpdateWithWhereUniqueWithoutStoreInputSchema), z.lazy(() => StoreAliasUpdateWithWhereUniqueWithoutStoreInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => StoreAliasUpdateManyWithWhereWithoutStoreInputSchema), z.lazy(() => StoreAliasUpdateManyWithWhereWithoutStoreInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => StoreAliasScalarWhereInputSchema), z.lazy(() => StoreAliasScalarWhereInputSchema).array() ]).optional(),
});

export const StoreCreateNestedOneWithoutAliasesInputSchema: z.ZodType<Prisma.StoreCreateNestedOneWithoutAliasesInput> = z.strictObject({
  create: z.union([ z.lazy(() => StoreCreateWithoutAliasesInputSchema), z.lazy(() => StoreUncheckedCreateWithoutAliasesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => StoreCreateOrConnectWithoutAliasesInputSchema).optional(),
  connect: z.lazy(() => StoreWhereUniqueInputSchema).optional(),
});

export const StoreUpdateOneRequiredWithoutAliasesNestedInputSchema: z.ZodType<Prisma.StoreUpdateOneRequiredWithoutAliasesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => StoreCreateWithoutAliasesInputSchema), z.lazy(() => StoreUncheckedCreateWithoutAliasesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => StoreCreateOrConnectWithoutAliasesInputSchema).optional(),
  upsert: z.lazy(() => StoreUpsertWithoutAliasesInputSchema).optional(),
  connect: z.lazy(() => StoreWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => StoreUpdateToOneWithWhereWithoutAliasesInputSchema), z.lazy(() => StoreUpdateWithoutAliasesInputSchema), z.lazy(() => StoreUncheckedUpdateWithoutAliasesInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutReceiptsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutReceiptsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutReceiptsInputSchema), z.lazy(() => UserUncheckedCreateWithoutReceiptsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutReceiptsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const StoreCreateNestedOneWithoutReceiptsInputSchema: z.ZodType<Prisma.StoreCreateNestedOneWithoutReceiptsInput> = z.strictObject({
  create: z.union([ z.lazy(() => StoreCreateWithoutReceiptsInputSchema), z.lazy(() => StoreUncheckedCreateWithoutReceiptsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => StoreCreateOrConnectWithoutReceiptsInputSchema).optional(),
  connect: z.lazy(() => StoreWhereUniqueInputSchema).optional(),
});

export const ReceiptItemCreateNestedManyWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemCreateNestedManyWithoutReceiptInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptItemCreateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemCreateWithoutReceiptInputSchema).array(), z.lazy(() => ReceiptItemUncheckedCreateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUncheckedCreateWithoutReceiptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptItemCreateOrConnectWithoutReceiptInputSchema), z.lazy(() => ReceiptItemCreateOrConnectWithoutReceiptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptItemCreateManyReceiptInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReceiptItemWhereUniqueInputSchema), z.lazy(() => ReceiptItemWhereUniqueInputSchema).array() ]).optional(),
});

export const ReceiptItemUncheckedCreateNestedManyWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemUncheckedCreateNestedManyWithoutReceiptInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptItemCreateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemCreateWithoutReceiptInputSchema).array(), z.lazy(() => ReceiptItemUncheckedCreateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUncheckedCreateWithoutReceiptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptItemCreateOrConnectWithoutReceiptInputSchema), z.lazy(() => ReceiptItemCreateOrConnectWithoutReceiptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptItemCreateManyReceiptInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ReceiptItemWhereUniqueInputSchema), z.lazy(() => ReceiptItemWhereUniqueInputSchema).array() ]).optional(),
});

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional().nullable(),
});

export const NullableDecimalFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDecimalFieldUpdateOperationsInput> = z.strictObject({
  set: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  increment: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  decrement: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  multiply: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  divide: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
});

export const UserUpdateOneRequiredWithoutReceiptsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutReceiptsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutReceiptsInputSchema), z.lazy(() => UserUncheckedCreateWithoutReceiptsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutReceiptsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutReceiptsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutReceiptsInputSchema), z.lazy(() => UserUpdateWithoutReceiptsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutReceiptsInputSchema) ]).optional(),
});

export const StoreUpdateOneWithoutReceiptsNestedInputSchema: z.ZodType<Prisma.StoreUpdateOneWithoutReceiptsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => StoreCreateWithoutReceiptsInputSchema), z.lazy(() => StoreUncheckedCreateWithoutReceiptsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => StoreCreateOrConnectWithoutReceiptsInputSchema).optional(),
  upsert: z.lazy(() => StoreUpsertWithoutReceiptsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => StoreWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => StoreWhereInputSchema) ]).optional(),
  connect: z.lazy(() => StoreWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => StoreUpdateToOneWithWhereWithoutReceiptsInputSchema), z.lazy(() => StoreUpdateWithoutReceiptsInputSchema), z.lazy(() => StoreUncheckedUpdateWithoutReceiptsInputSchema) ]).optional(),
});

export const ReceiptItemUpdateManyWithoutReceiptNestedInputSchema: z.ZodType<Prisma.ReceiptItemUpdateManyWithoutReceiptNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptItemCreateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemCreateWithoutReceiptInputSchema).array(), z.lazy(() => ReceiptItemUncheckedCreateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUncheckedCreateWithoutReceiptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptItemCreateOrConnectWithoutReceiptInputSchema), z.lazy(() => ReceiptItemCreateOrConnectWithoutReceiptInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReceiptItemUpsertWithWhereUniqueWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUpsertWithWhereUniqueWithoutReceiptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptItemCreateManyReceiptInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReceiptItemWhereUniqueInputSchema), z.lazy(() => ReceiptItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReceiptItemWhereUniqueInputSchema), z.lazy(() => ReceiptItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReceiptItemWhereUniqueInputSchema), z.lazy(() => ReceiptItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReceiptItemWhereUniqueInputSchema), z.lazy(() => ReceiptItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReceiptItemUpdateWithWhereUniqueWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUpdateWithWhereUniqueWithoutReceiptInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReceiptItemUpdateManyWithWhereWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUpdateManyWithWhereWithoutReceiptInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReceiptItemScalarWhereInputSchema), z.lazy(() => ReceiptItemScalarWhereInputSchema).array() ]).optional(),
});

export const ReceiptItemUncheckedUpdateManyWithoutReceiptNestedInputSchema: z.ZodType<Prisma.ReceiptItemUncheckedUpdateManyWithoutReceiptNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptItemCreateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemCreateWithoutReceiptInputSchema).array(), z.lazy(() => ReceiptItemUncheckedCreateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUncheckedCreateWithoutReceiptInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ReceiptItemCreateOrConnectWithoutReceiptInputSchema), z.lazy(() => ReceiptItemCreateOrConnectWithoutReceiptInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ReceiptItemUpsertWithWhereUniqueWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUpsertWithWhereUniqueWithoutReceiptInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ReceiptItemCreateManyReceiptInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ReceiptItemWhereUniqueInputSchema), z.lazy(() => ReceiptItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ReceiptItemWhereUniqueInputSchema), z.lazy(() => ReceiptItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ReceiptItemWhereUniqueInputSchema), z.lazy(() => ReceiptItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ReceiptItemWhereUniqueInputSchema), z.lazy(() => ReceiptItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ReceiptItemUpdateWithWhereUniqueWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUpdateWithWhereUniqueWithoutReceiptInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ReceiptItemUpdateManyWithWhereWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUpdateManyWithWhereWithoutReceiptInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ReceiptItemScalarWhereInputSchema), z.lazy(() => ReceiptItemScalarWhereInputSchema).array() ]).optional(),
});

export const ReceiptCreateNestedOneWithoutItemsInputSchema: z.ZodType<Prisma.ReceiptCreateNestedOneWithoutItemsInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptCreateWithoutItemsInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ReceiptCreateOrConnectWithoutItemsInputSchema).optional(),
  connect: z.lazy(() => ReceiptWhereUniqueInputSchema).optional(),
});

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const ReceiptUpdateOneRequiredWithoutItemsNestedInputSchema: z.ZodType<Prisma.ReceiptUpdateOneRequiredWithoutItemsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ReceiptCreateWithoutItemsInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ReceiptCreateOrConnectWithoutItemsInputSchema).optional(),
  upsert: z.lazy(() => ReceiptUpsertWithoutItemsInputSchema).optional(),
  connect: z.lazy(() => ReceiptWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ReceiptUpdateToOneWithWhereWithoutItemsInputSchema), z.lazy(() => ReceiptUpdateWithoutItemsInputSchema), z.lazy(() => ReceiptUncheckedUpdateWithoutItemsInputSchema) ]).optional(),
});

export const StoreCreateNestedOneWithoutPromosInputSchema: z.ZodType<Prisma.StoreCreateNestedOneWithoutPromosInput> = z.strictObject({
  create: z.union([ z.lazy(() => StoreCreateWithoutPromosInputSchema), z.lazy(() => StoreUncheckedCreateWithoutPromosInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => StoreCreateOrConnectWithoutPromosInputSchema).optional(),
  connect: z.lazy(() => StoreWhereUniqueInputSchema).optional(),
});

export const UserPromoCreateNestedManyWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoCreateNestedManyWithoutPromoInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPromoCreateWithoutPromoInputSchema), z.lazy(() => UserPromoCreateWithoutPromoInputSchema).array(), z.lazy(() => UserPromoUncheckedCreateWithoutPromoInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutPromoInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserPromoCreateOrConnectWithoutPromoInputSchema), z.lazy(() => UserPromoCreateOrConnectWithoutPromoInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserPromoCreateManyPromoInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
});

export const UserPromoUncheckedCreateNestedManyWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoUncheckedCreateNestedManyWithoutPromoInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPromoCreateWithoutPromoInputSchema), z.lazy(() => UserPromoCreateWithoutPromoInputSchema).array(), z.lazy(() => UserPromoUncheckedCreateWithoutPromoInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutPromoInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserPromoCreateOrConnectWithoutPromoInputSchema), z.lazy(() => UserPromoCreateOrConnectWithoutPromoInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserPromoCreateManyPromoInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
});

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const StoreUpdateOneWithoutPromosNestedInputSchema: z.ZodType<Prisma.StoreUpdateOneWithoutPromosNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => StoreCreateWithoutPromosInputSchema), z.lazy(() => StoreUncheckedCreateWithoutPromosInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => StoreCreateOrConnectWithoutPromosInputSchema).optional(),
  upsert: z.lazy(() => StoreUpsertWithoutPromosInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => StoreWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => StoreWhereInputSchema) ]).optional(),
  connect: z.lazy(() => StoreWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => StoreUpdateToOneWithWhereWithoutPromosInputSchema), z.lazy(() => StoreUpdateWithoutPromosInputSchema), z.lazy(() => StoreUncheckedUpdateWithoutPromosInputSchema) ]).optional(),
});

export const UserPromoUpdateManyWithoutPromoNestedInputSchema: z.ZodType<Prisma.UserPromoUpdateManyWithoutPromoNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPromoCreateWithoutPromoInputSchema), z.lazy(() => UserPromoCreateWithoutPromoInputSchema).array(), z.lazy(() => UserPromoUncheckedCreateWithoutPromoInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutPromoInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserPromoCreateOrConnectWithoutPromoInputSchema), z.lazy(() => UserPromoCreateOrConnectWithoutPromoInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserPromoUpsertWithWhereUniqueWithoutPromoInputSchema), z.lazy(() => UserPromoUpsertWithWhereUniqueWithoutPromoInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserPromoCreateManyPromoInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserPromoUpdateWithWhereUniqueWithoutPromoInputSchema), z.lazy(() => UserPromoUpdateWithWhereUniqueWithoutPromoInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserPromoUpdateManyWithWhereWithoutPromoInputSchema), z.lazy(() => UserPromoUpdateManyWithWhereWithoutPromoInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserPromoScalarWhereInputSchema), z.lazy(() => UserPromoScalarWhereInputSchema).array() ]).optional(),
});

export const UserPromoUncheckedUpdateManyWithoutPromoNestedInputSchema: z.ZodType<Prisma.UserPromoUncheckedUpdateManyWithoutPromoNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserPromoCreateWithoutPromoInputSchema), z.lazy(() => UserPromoCreateWithoutPromoInputSchema).array(), z.lazy(() => UserPromoUncheckedCreateWithoutPromoInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutPromoInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserPromoCreateOrConnectWithoutPromoInputSchema), z.lazy(() => UserPromoCreateOrConnectWithoutPromoInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserPromoUpsertWithWhereUniqueWithoutPromoInputSchema), z.lazy(() => UserPromoUpsertWithWhereUniqueWithoutPromoInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserPromoCreateManyPromoInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserPromoWhereUniqueInputSchema), z.lazy(() => UserPromoWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserPromoUpdateWithWhereUniqueWithoutPromoInputSchema), z.lazy(() => UserPromoUpdateWithWhereUniqueWithoutPromoInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserPromoUpdateManyWithWhereWithoutPromoInputSchema), z.lazy(() => UserPromoUpdateManyWithWhereWithoutPromoInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserPromoScalarWhereInputSchema), z.lazy(() => UserPromoScalarWhereInputSchema).array() ]).optional(),
});

export const UserCreateNestedOneWithoutUserPromosInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutUserPromosInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutUserPromosInputSchema), z.lazy(() => UserUncheckedCreateWithoutUserPromosInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutUserPromosInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const PromoCreateNestedOneWithoutUserPromosInputSchema: z.ZodType<Prisma.PromoCreateNestedOneWithoutUserPromosInput> = z.strictObject({
  create: z.union([ z.lazy(() => PromoCreateWithoutUserPromosInputSchema), z.lazy(() => PromoUncheckedCreateWithoutUserPromosInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PromoCreateOrConnectWithoutUserPromosInputSchema).optional(),
  connect: z.lazy(() => PromoWhereUniqueInputSchema).optional(),
});

export const UserUpdateOneRequiredWithoutUserPromosNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutUserPromosNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutUserPromosInputSchema), z.lazy(() => UserUncheckedCreateWithoutUserPromosInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutUserPromosInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutUserPromosInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutUserPromosInputSchema), z.lazy(() => UserUpdateWithoutUserPromosInputSchema), z.lazy(() => UserUncheckedUpdateWithoutUserPromosInputSchema) ]).optional(),
});

export const PromoUpdateOneRequiredWithoutUserPromosNestedInputSchema: z.ZodType<Prisma.PromoUpdateOneRequiredWithoutUserPromosNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PromoCreateWithoutUserPromosInputSchema), z.lazy(() => PromoUncheckedCreateWithoutUserPromosInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PromoCreateOrConnectWithoutUserPromosInputSchema).optional(),
  upsert: z.lazy(() => PromoUpsertWithoutUserPromosInputSchema).optional(),
  connect: z.lazy(() => PromoWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PromoUpdateToOneWithWhereWithoutUserPromosInputSchema), z.lazy(() => PromoUpdateWithoutUserPromosInputSchema), z.lazy(() => PromoUncheckedUpdateWithoutUserPromosInputSchema) ]).optional(),
});

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const NestedJsonFilterSchema: z.ZodType<Prisma.NestedJsonFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDecimalNullableFilterSchema: z.ZodType<Prisma.NestedDecimalNullableFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const NestedDecimalNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDecimalNullableWithAggregatesFilter> = z.strictObject({
  equals: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional().nullable(),
  lt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalNullableFilterSchema).optional(),
});

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
});

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
});

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const UserPreferencesCreateWithoutUserInputSchema: z.ZodType<Prisma.UserPreferencesCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.coerce.date().optional(),
});

export const UserPreferencesUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.UserPreferencesUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.coerce.date().optional(),
});

export const UserPreferencesCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.UserPreferencesCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => UserPreferencesWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserPreferencesCreateWithoutUserInputSchema), z.lazy(() => UserPreferencesUncheckedCreateWithoutUserInputSchema) ]),
});

export const ReceiptCreateWithoutUserInputSchema: z.ZodType<Prisma.ReceiptCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  store: z.lazy(() => StoreCreateNestedOneWithoutReceiptsInputSchema).optional(),
  items: z.lazy(() => ReceiptItemCreateNestedManyWithoutReceiptInputSchema).optional(),
});

export const ReceiptUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.ReceiptUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  store_id: z.string().optional().nullable(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  items: z.lazy(() => ReceiptItemUncheckedCreateNestedManyWithoutReceiptInputSchema).optional(),
});

export const ReceiptCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.ReceiptCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => ReceiptWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReceiptCreateWithoutUserInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutUserInputSchema) ]),
});

export const ReceiptCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.ReceiptCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ReceiptCreateManyUserInputSchema), z.lazy(() => ReceiptCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const UserPromoCreateWithoutUserInputSchema: z.ZodType<Prisma.UserPromoCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  is_available: z.boolean().optional(),
  redeemed_at: z.coerce.date().optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  promo: z.lazy(() => PromoCreateNestedOneWithoutUserPromosInputSchema),
});

export const UserPromoUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.UserPromoUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.cuid().optional(),
  promo_id: z.string(),
  is_available: z.boolean().optional(),
  redeemed_at: z.coerce.date().optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const UserPromoCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.UserPromoCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => UserPromoWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserPromoCreateWithoutUserInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutUserInputSchema) ]),
});

export const UserPromoCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.UserPromoCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => UserPromoCreateManyUserInputSchema), z.lazy(() => UserPromoCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const UserPreferencesUpsertWithoutUserInputSchema: z.ZodType<Prisma.UserPreferencesUpsertWithoutUserInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserPreferencesUpdateWithoutUserInputSchema), z.lazy(() => UserPreferencesUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => UserPreferencesCreateWithoutUserInputSchema), z.lazy(() => UserPreferencesUncheckedCreateWithoutUserInputSchema) ]),
  where: z.lazy(() => UserPreferencesWhereInputSchema).optional(),
});

export const UserPreferencesUpdateToOneWithWhereWithoutUserInputSchema: z.ZodType<Prisma.UserPreferencesUpdateToOneWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => UserPreferencesWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserPreferencesUpdateWithoutUserInputSchema), z.lazy(() => UserPreferencesUncheckedUpdateWithoutUserInputSchema) ]),
});

export const UserPreferencesUpdateWithoutUserInputSchema: z.ZodType<Prisma.UserPreferencesUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserPreferencesUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.UserPreferencesUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  goals: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  lifestyles: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  ingredients_to_avoid: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReceiptUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.ReceiptUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => ReceiptWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ReceiptUpdateWithoutUserInputSchema), z.lazy(() => ReceiptUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => ReceiptCreateWithoutUserInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutUserInputSchema) ]),
});

export const ReceiptUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.ReceiptUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => ReceiptWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ReceiptUpdateWithoutUserInputSchema), z.lazy(() => ReceiptUncheckedUpdateWithoutUserInputSchema) ]),
});

export const ReceiptUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.ReceiptUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => ReceiptScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ReceiptUpdateManyMutationInputSchema), z.lazy(() => ReceiptUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const ReceiptScalarWhereInputSchema: z.ZodType<Prisma.ReceiptScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReceiptScalarWhereInputSchema), z.lazy(() => ReceiptScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReceiptScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReceiptScalarWhereInputSchema), z.lazy(() => ReceiptScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  user_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  store_name_raw: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  receipt_date: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  currency_code: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  subtotal: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  tax: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  tax_rate: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  total: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  payment_method: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  payment_last4: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  scanned_text: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  image_uri: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  storage: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  error_message: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updated_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const UserPromoUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.UserPromoUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => UserPromoWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => UserPromoUpdateWithoutUserInputSchema), z.lazy(() => UserPromoUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => UserPromoCreateWithoutUserInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutUserInputSchema) ]),
});

export const UserPromoUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.UserPromoUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => UserPromoWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => UserPromoUpdateWithoutUserInputSchema), z.lazy(() => UserPromoUncheckedUpdateWithoutUserInputSchema) ]),
});

export const UserPromoUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.UserPromoUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => UserPromoScalarWhereInputSchema),
  data: z.union([ z.lazy(() => UserPromoUpdateManyMutationInputSchema), z.lazy(() => UserPromoUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const UserPromoScalarWhereInputSchema: z.ZodType<Prisma.UserPromoScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserPromoScalarWhereInputSchema), z.lazy(() => UserPromoScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserPromoScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserPromoScalarWhereInputSchema), z.lazy(() => UserPromoScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  user_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  promo_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  is_available: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  redeemed_at: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  payload: z.lazy(() => JsonFilterSchema).optional(),
});

export const UserCreateWithoutPreferencesInputSchema: z.ZodType<Prisma.UserCreateWithoutPreferencesInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  onboarding_completed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  receipts: z.lazy(() => ReceiptCreateNestedManyWithoutUserInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutPreferencesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutPreferencesInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  onboarding_completed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  receipts: z.lazy(() => ReceiptUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutPreferencesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutPreferencesInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutPreferencesInputSchema), z.lazy(() => UserUncheckedCreateWithoutPreferencesInputSchema) ]),
});

export const UserUpsertWithoutPreferencesInputSchema: z.ZodType<Prisma.UserUpsertWithoutPreferencesInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutPreferencesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutPreferencesInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutPreferencesInputSchema), z.lazy(() => UserUncheckedCreateWithoutPreferencesInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutPreferencesInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutPreferencesInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutPreferencesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutPreferencesInputSchema) ]),
});

export const UserUpdateWithoutPreferencesInputSchema: z.ZodType<Prisma.UserUpdateWithoutPreferencesInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password_hash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  onboarding_completed: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  receipts: z.lazy(() => ReceiptUpdateManyWithoutUserNestedInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutPreferencesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutPreferencesInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password_hash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  onboarding_completed: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  receipts: z.lazy(() => ReceiptUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const ReceiptCreateWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptCreateWithoutStoreInput> = z.strictObject({
  id: z.cuid().optional(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutReceiptsInputSchema),
  items: z.lazy(() => ReceiptItemCreateNestedManyWithoutReceiptInputSchema).optional(),
});

export const ReceiptUncheckedCreateWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptUncheckedCreateWithoutStoreInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  items: z.lazy(() => ReceiptItemUncheckedCreateNestedManyWithoutReceiptInputSchema).optional(),
});

export const ReceiptCreateOrConnectWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptCreateOrConnectWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => ReceiptWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReceiptCreateWithoutStoreInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutStoreInputSchema) ]),
});

export const ReceiptCreateManyStoreInputEnvelopeSchema: z.ZodType<Prisma.ReceiptCreateManyStoreInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ReceiptCreateManyStoreInputSchema), z.lazy(() => ReceiptCreateManyStoreInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PromoCreateWithoutStoreInputSchema: z.ZodType<Prisma.PromoCreateWithoutStoreInput> = z.strictObject({
  id: z.cuid().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  promo_type: z.string(),
  icon_name: z.string().optional().nullable(),
  receipts_required: z.number().int().optional(),
  validity_start: z.coerce.date().optional().nullable(),
  validity_end: z.coerce.date().optional().nullable(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  userPromos: z.lazy(() => UserPromoCreateNestedManyWithoutPromoInputSchema).optional(),
});

export const PromoUncheckedCreateWithoutStoreInputSchema: z.ZodType<Prisma.PromoUncheckedCreateWithoutStoreInput> = z.strictObject({
  id: z.cuid().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  promo_type: z.string(),
  icon_name: z.string().optional().nullable(),
  receipts_required: z.number().int().optional(),
  validity_start: z.coerce.date().optional().nullable(),
  validity_end: z.coerce.date().optional().nullable(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  userPromos: z.lazy(() => UserPromoUncheckedCreateNestedManyWithoutPromoInputSchema).optional(),
});

export const PromoCreateOrConnectWithoutStoreInputSchema: z.ZodType<Prisma.PromoCreateOrConnectWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => PromoWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PromoCreateWithoutStoreInputSchema), z.lazy(() => PromoUncheckedCreateWithoutStoreInputSchema) ]),
});

export const PromoCreateManyStoreInputEnvelopeSchema: z.ZodType<Prisma.PromoCreateManyStoreInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => PromoCreateManyStoreInputSchema), z.lazy(() => PromoCreateManyStoreInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const StoreAliasCreateWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasCreateWithoutStoreInput> = z.strictObject({
  id: z.cuid().optional(),
  alias: z.string(),
});

export const StoreAliasUncheckedCreateWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasUncheckedCreateWithoutStoreInput> = z.strictObject({
  id: z.cuid().optional(),
  alias: z.string(),
});

export const StoreAliasCreateOrConnectWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasCreateOrConnectWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => StoreAliasWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => StoreAliasCreateWithoutStoreInputSchema), z.lazy(() => StoreAliasUncheckedCreateWithoutStoreInputSchema) ]),
});

export const StoreAliasCreateManyStoreInputEnvelopeSchema: z.ZodType<Prisma.StoreAliasCreateManyStoreInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => StoreAliasCreateManyStoreInputSchema), z.lazy(() => StoreAliasCreateManyStoreInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const ReceiptUpsertWithWhereUniqueWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptUpsertWithWhereUniqueWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => ReceiptWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ReceiptUpdateWithoutStoreInputSchema), z.lazy(() => ReceiptUncheckedUpdateWithoutStoreInputSchema) ]),
  create: z.union([ z.lazy(() => ReceiptCreateWithoutStoreInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutStoreInputSchema) ]),
});

export const ReceiptUpdateWithWhereUniqueWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptUpdateWithWhereUniqueWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => ReceiptWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ReceiptUpdateWithoutStoreInputSchema), z.lazy(() => ReceiptUncheckedUpdateWithoutStoreInputSchema) ]),
});

export const ReceiptUpdateManyWithWhereWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptUpdateManyWithWhereWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => ReceiptScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ReceiptUpdateManyMutationInputSchema), z.lazy(() => ReceiptUncheckedUpdateManyWithoutStoreInputSchema) ]),
});

export const PromoUpsertWithWhereUniqueWithoutStoreInputSchema: z.ZodType<Prisma.PromoUpsertWithWhereUniqueWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => PromoWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PromoUpdateWithoutStoreInputSchema), z.lazy(() => PromoUncheckedUpdateWithoutStoreInputSchema) ]),
  create: z.union([ z.lazy(() => PromoCreateWithoutStoreInputSchema), z.lazy(() => PromoUncheckedCreateWithoutStoreInputSchema) ]),
});

export const PromoUpdateWithWhereUniqueWithoutStoreInputSchema: z.ZodType<Prisma.PromoUpdateWithWhereUniqueWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => PromoWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PromoUpdateWithoutStoreInputSchema), z.lazy(() => PromoUncheckedUpdateWithoutStoreInputSchema) ]),
});

export const PromoUpdateManyWithWhereWithoutStoreInputSchema: z.ZodType<Prisma.PromoUpdateManyWithWhereWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => PromoScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PromoUpdateManyMutationInputSchema), z.lazy(() => PromoUncheckedUpdateManyWithoutStoreInputSchema) ]),
});

export const PromoScalarWhereInputSchema: z.ZodType<Prisma.PromoScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PromoScalarWhereInputSchema), z.lazy(() => PromoScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PromoScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PromoScalarWhereInputSchema), z.lazy(() => PromoScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  promo_type: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  icon_name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  receipts_required: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  validity_start: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  validity_end: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  is_active: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  created_at: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const StoreAliasUpsertWithWhereUniqueWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasUpsertWithWhereUniqueWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => StoreAliasWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => StoreAliasUpdateWithoutStoreInputSchema), z.lazy(() => StoreAliasUncheckedUpdateWithoutStoreInputSchema) ]),
  create: z.union([ z.lazy(() => StoreAliasCreateWithoutStoreInputSchema), z.lazy(() => StoreAliasUncheckedCreateWithoutStoreInputSchema) ]),
});

export const StoreAliasUpdateWithWhereUniqueWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasUpdateWithWhereUniqueWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => StoreAliasWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => StoreAliasUpdateWithoutStoreInputSchema), z.lazy(() => StoreAliasUncheckedUpdateWithoutStoreInputSchema) ]),
});

export const StoreAliasUpdateManyWithWhereWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasUpdateManyWithWhereWithoutStoreInput> = z.strictObject({
  where: z.lazy(() => StoreAliasScalarWhereInputSchema),
  data: z.union([ z.lazy(() => StoreAliasUpdateManyMutationInputSchema), z.lazy(() => StoreAliasUncheckedUpdateManyWithoutStoreInputSchema) ]),
});

export const StoreAliasScalarWhereInputSchema: z.ZodType<Prisma.StoreAliasScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => StoreAliasScalarWhereInputSchema), z.lazy(() => StoreAliasScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => StoreAliasScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StoreAliasScalarWhereInputSchema), z.lazy(() => StoreAliasScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  store_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  alias: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
});

export const StoreCreateWithoutAliasesInputSchema: z.ZodType<Prisma.StoreCreateWithoutAliasesInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  logo_path: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  receipts: z.lazy(() => ReceiptCreateNestedManyWithoutStoreInputSchema).optional(),
  promos: z.lazy(() => PromoCreateNestedManyWithoutStoreInputSchema).optional(),
});

export const StoreUncheckedCreateWithoutAliasesInputSchema: z.ZodType<Prisma.StoreUncheckedCreateWithoutAliasesInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  logo_path: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  receipts: z.lazy(() => ReceiptUncheckedCreateNestedManyWithoutStoreInputSchema).optional(),
  promos: z.lazy(() => PromoUncheckedCreateNestedManyWithoutStoreInputSchema).optional(),
});

export const StoreCreateOrConnectWithoutAliasesInputSchema: z.ZodType<Prisma.StoreCreateOrConnectWithoutAliasesInput> = z.strictObject({
  where: z.lazy(() => StoreWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => StoreCreateWithoutAliasesInputSchema), z.lazy(() => StoreUncheckedCreateWithoutAliasesInputSchema) ]),
});

export const StoreUpsertWithoutAliasesInputSchema: z.ZodType<Prisma.StoreUpsertWithoutAliasesInput> = z.strictObject({
  update: z.union([ z.lazy(() => StoreUpdateWithoutAliasesInputSchema), z.lazy(() => StoreUncheckedUpdateWithoutAliasesInputSchema) ]),
  create: z.union([ z.lazy(() => StoreCreateWithoutAliasesInputSchema), z.lazy(() => StoreUncheckedCreateWithoutAliasesInputSchema) ]),
  where: z.lazy(() => StoreWhereInputSchema).optional(),
});

export const StoreUpdateToOneWithWhereWithoutAliasesInputSchema: z.ZodType<Prisma.StoreUpdateToOneWithWhereWithoutAliasesInput> = z.strictObject({
  where: z.lazy(() => StoreWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => StoreUpdateWithoutAliasesInputSchema), z.lazy(() => StoreUncheckedUpdateWithoutAliasesInputSchema) ]),
});

export const StoreUpdateWithoutAliasesInputSchema: z.ZodType<Prisma.StoreUpdateWithoutAliasesInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo_path: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  receipts: z.lazy(() => ReceiptUpdateManyWithoutStoreNestedInputSchema).optional(),
  promos: z.lazy(() => PromoUpdateManyWithoutStoreNestedInputSchema).optional(),
});

export const StoreUncheckedUpdateWithoutAliasesInputSchema: z.ZodType<Prisma.StoreUncheckedUpdateWithoutAliasesInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo_path: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  receipts: z.lazy(() => ReceiptUncheckedUpdateManyWithoutStoreNestedInputSchema).optional(),
  promos: z.lazy(() => PromoUncheckedUpdateManyWithoutStoreNestedInputSchema).optional(),
});

export const UserCreateWithoutReceiptsInputSchema: z.ZodType<Prisma.UserCreateWithoutReceiptsInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  onboarding_completed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  preferences: z.lazy(() => UserPreferencesCreateNestedOneWithoutUserInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutReceiptsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutReceiptsInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  onboarding_completed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  preferences: z.lazy(() => UserPreferencesUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutReceiptsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutReceiptsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutReceiptsInputSchema), z.lazy(() => UserUncheckedCreateWithoutReceiptsInputSchema) ]),
});

export const StoreCreateWithoutReceiptsInputSchema: z.ZodType<Prisma.StoreCreateWithoutReceiptsInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  logo_path: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  promos: z.lazy(() => PromoCreateNestedManyWithoutStoreInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasCreateNestedManyWithoutStoreInputSchema).optional(),
});

export const StoreUncheckedCreateWithoutReceiptsInputSchema: z.ZodType<Prisma.StoreUncheckedCreateWithoutReceiptsInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  logo_path: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  promos: z.lazy(() => PromoUncheckedCreateNestedManyWithoutStoreInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasUncheckedCreateNestedManyWithoutStoreInputSchema).optional(),
});

export const StoreCreateOrConnectWithoutReceiptsInputSchema: z.ZodType<Prisma.StoreCreateOrConnectWithoutReceiptsInput> = z.strictObject({
  where: z.lazy(() => StoreWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => StoreCreateWithoutReceiptsInputSchema), z.lazy(() => StoreUncheckedCreateWithoutReceiptsInputSchema) ]),
});

export const ReceiptItemCreateWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemCreateWithoutReceiptInput> = z.strictObject({
  id: z.cuid().optional(),
  line_number: z.number().int().optional().nullable(),
  original_text: z.string().optional().nullable(),
  product_name: z.string().optional().nullable(),
  quantity: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unit: z.string().optional().nullable(),
  unit_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  matched: z.boolean().optional(),
  match_score: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  qdrant_collection: z.string().optional().nullable(),
  qdrant_point_id: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  factor_co2_per_unit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  factor_unit: z.string().optional().nullable(),
  factor_source: z.string().optional().nullable(),
  factor_version: z.string().optional().nullable(),
  is_eco_flag: z.boolean().optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptItemUncheckedCreateWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemUncheckedCreateWithoutReceiptInput> = z.strictObject({
  id: z.cuid().optional(),
  line_number: z.number().int().optional().nullable(),
  original_text: z.string().optional().nullable(),
  product_name: z.string().optional().nullable(),
  quantity: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unit: z.string().optional().nullable(),
  unit_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  matched: z.boolean().optional(),
  match_score: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  qdrant_collection: z.string().optional().nullable(),
  qdrant_point_id: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  factor_co2_per_unit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  factor_unit: z.string().optional().nullable(),
  factor_source: z.string().optional().nullable(),
  factor_version: z.string().optional().nullable(),
  is_eco_flag: z.boolean().optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptItemCreateOrConnectWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemCreateOrConnectWithoutReceiptInput> = z.strictObject({
  where: z.lazy(() => ReceiptItemWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReceiptItemCreateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUncheckedCreateWithoutReceiptInputSchema) ]),
});

export const ReceiptItemCreateManyReceiptInputEnvelopeSchema: z.ZodType<Prisma.ReceiptItemCreateManyReceiptInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ReceiptItemCreateManyReceiptInputSchema), z.lazy(() => ReceiptItemCreateManyReceiptInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const UserUpsertWithoutReceiptsInputSchema: z.ZodType<Prisma.UserUpsertWithoutReceiptsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutReceiptsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutReceiptsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutReceiptsInputSchema), z.lazy(() => UserUncheckedCreateWithoutReceiptsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutReceiptsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutReceiptsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutReceiptsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutReceiptsInputSchema) ]),
});

export const UserUpdateWithoutReceiptsInputSchema: z.ZodType<Prisma.UserUpdateWithoutReceiptsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password_hash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  onboarding_completed: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  preferences: z.lazy(() => UserPreferencesUpdateOneWithoutUserNestedInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutReceiptsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutReceiptsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password_hash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  onboarding_completed: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  preferences: z.lazy(() => UserPreferencesUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  userPromos: z.lazy(() => UserPromoUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const StoreUpsertWithoutReceiptsInputSchema: z.ZodType<Prisma.StoreUpsertWithoutReceiptsInput> = z.strictObject({
  update: z.union([ z.lazy(() => StoreUpdateWithoutReceiptsInputSchema), z.lazy(() => StoreUncheckedUpdateWithoutReceiptsInputSchema) ]),
  create: z.union([ z.lazy(() => StoreCreateWithoutReceiptsInputSchema), z.lazy(() => StoreUncheckedCreateWithoutReceiptsInputSchema) ]),
  where: z.lazy(() => StoreWhereInputSchema).optional(),
});

export const StoreUpdateToOneWithWhereWithoutReceiptsInputSchema: z.ZodType<Prisma.StoreUpdateToOneWithWhereWithoutReceiptsInput> = z.strictObject({
  where: z.lazy(() => StoreWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => StoreUpdateWithoutReceiptsInputSchema), z.lazy(() => StoreUncheckedUpdateWithoutReceiptsInputSchema) ]),
});

export const StoreUpdateWithoutReceiptsInputSchema: z.ZodType<Prisma.StoreUpdateWithoutReceiptsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo_path: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  promos: z.lazy(() => PromoUpdateManyWithoutStoreNestedInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasUpdateManyWithoutStoreNestedInputSchema).optional(),
});

export const StoreUncheckedUpdateWithoutReceiptsInputSchema: z.ZodType<Prisma.StoreUncheckedUpdateWithoutReceiptsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo_path: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  promos: z.lazy(() => PromoUncheckedUpdateManyWithoutStoreNestedInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasUncheckedUpdateManyWithoutStoreNestedInputSchema).optional(),
});

export const ReceiptItemUpsertWithWhereUniqueWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemUpsertWithWhereUniqueWithoutReceiptInput> = z.strictObject({
  where: z.lazy(() => ReceiptItemWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ReceiptItemUpdateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUncheckedUpdateWithoutReceiptInputSchema) ]),
  create: z.union([ z.lazy(() => ReceiptItemCreateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUncheckedCreateWithoutReceiptInputSchema) ]),
});

export const ReceiptItemUpdateWithWhereUniqueWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemUpdateWithWhereUniqueWithoutReceiptInput> = z.strictObject({
  where: z.lazy(() => ReceiptItemWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ReceiptItemUpdateWithoutReceiptInputSchema), z.lazy(() => ReceiptItemUncheckedUpdateWithoutReceiptInputSchema) ]),
});

export const ReceiptItemUpdateManyWithWhereWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemUpdateManyWithWhereWithoutReceiptInput> = z.strictObject({
  where: z.lazy(() => ReceiptItemScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ReceiptItemUpdateManyMutationInputSchema), z.lazy(() => ReceiptItemUncheckedUpdateManyWithoutReceiptInputSchema) ]),
});

export const ReceiptItemScalarWhereInputSchema: z.ZodType<Prisma.ReceiptItemScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ReceiptItemScalarWhereInputSchema), z.lazy(() => ReceiptItemScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ReceiptItemScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ReceiptItemScalarWhereInputSchema), z.lazy(() => ReceiptItemScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  receipt_id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  line_number: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  original_text: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  product_name: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  quantity: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  unit: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  unit_price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  total_price: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  matched: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  match_score: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  qdrant_collection: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  qdrant_point_id: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  brand: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  subcategory: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.lazy(() => DecimalNullableFilterSchema), z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional().nullable(),
  factor_unit: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  factor_source: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  factor_version: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  is_eco_flag: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  flags: z.lazy(() => JsonFilterSchema).optional(),
});

export const ReceiptCreateWithoutItemsInputSchema: z.ZodType<Prisma.ReceiptCreateWithoutItemsInput> = z.strictObject({
  id: z.cuid().optional(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutReceiptsInputSchema),
  store: z.lazy(() => StoreCreateNestedOneWithoutReceiptsInputSchema).optional(),
});

export const ReceiptUncheckedCreateWithoutItemsInputSchema: z.ZodType<Prisma.ReceiptUncheckedCreateWithoutItemsInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  store_id: z.string().optional().nullable(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const ReceiptCreateOrConnectWithoutItemsInputSchema: z.ZodType<Prisma.ReceiptCreateOrConnectWithoutItemsInput> = z.strictObject({
  where: z.lazy(() => ReceiptWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ReceiptCreateWithoutItemsInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutItemsInputSchema) ]),
});

export const ReceiptUpsertWithoutItemsInputSchema: z.ZodType<Prisma.ReceiptUpsertWithoutItemsInput> = z.strictObject({
  update: z.union([ z.lazy(() => ReceiptUpdateWithoutItemsInputSchema), z.lazy(() => ReceiptUncheckedUpdateWithoutItemsInputSchema) ]),
  create: z.union([ z.lazy(() => ReceiptCreateWithoutItemsInputSchema), z.lazy(() => ReceiptUncheckedCreateWithoutItemsInputSchema) ]),
  where: z.lazy(() => ReceiptWhereInputSchema).optional(),
});

export const ReceiptUpdateToOneWithWhereWithoutItemsInputSchema: z.ZodType<Prisma.ReceiptUpdateToOneWithWhereWithoutItemsInput> = z.strictObject({
  where: z.lazy(() => ReceiptWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ReceiptUpdateWithoutItemsInputSchema), z.lazy(() => ReceiptUncheckedUpdateWithoutItemsInputSchema) ]),
});

export const ReceiptUpdateWithoutItemsInputSchema: z.ZodType<Prisma.ReceiptUpdateWithoutItemsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutReceiptsNestedInputSchema).optional(),
  store: z.lazy(() => StoreUpdateOneWithoutReceiptsNestedInputSchema).optional(),
});

export const ReceiptUncheckedUpdateWithoutItemsInputSchema: z.ZodType<Prisma.ReceiptUncheckedUpdateWithoutItemsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StoreCreateWithoutPromosInputSchema: z.ZodType<Prisma.StoreCreateWithoutPromosInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  logo_path: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  receipts: z.lazy(() => ReceiptCreateNestedManyWithoutStoreInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasCreateNestedManyWithoutStoreInputSchema).optional(),
});

export const StoreUncheckedCreateWithoutPromosInputSchema: z.ZodType<Prisma.StoreUncheckedCreateWithoutPromosInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  logo_path: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  receipts: z.lazy(() => ReceiptUncheckedCreateNestedManyWithoutStoreInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasUncheckedCreateNestedManyWithoutStoreInputSchema).optional(),
});

export const StoreCreateOrConnectWithoutPromosInputSchema: z.ZodType<Prisma.StoreCreateOrConnectWithoutPromosInput> = z.strictObject({
  where: z.lazy(() => StoreWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => StoreCreateWithoutPromosInputSchema), z.lazy(() => StoreUncheckedCreateWithoutPromosInputSchema) ]),
});

export const UserPromoCreateWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoCreateWithoutPromoInput> = z.strictObject({
  id: z.cuid().optional(),
  is_available: z.boolean().optional(),
  redeemed_at: z.coerce.date().optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutUserPromosInputSchema),
});

export const UserPromoUncheckedCreateWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoUncheckedCreateWithoutPromoInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  is_available: z.boolean().optional(),
  redeemed_at: z.coerce.date().optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const UserPromoCreateOrConnectWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoCreateOrConnectWithoutPromoInput> = z.strictObject({
  where: z.lazy(() => UserPromoWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserPromoCreateWithoutPromoInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutPromoInputSchema) ]),
});

export const UserPromoCreateManyPromoInputEnvelopeSchema: z.ZodType<Prisma.UserPromoCreateManyPromoInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => UserPromoCreateManyPromoInputSchema), z.lazy(() => UserPromoCreateManyPromoInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const StoreUpsertWithoutPromosInputSchema: z.ZodType<Prisma.StoreUpsertWithoutPromosInput> = z.strictObject({
  update: z.union([ z.lazy(() => StoreUpdateWithoutPromosInputSchema), z.lazy(() => StoreUncheckedUpdateWithoutPromosInputSchema) ]),
  create: z.union([ z.lazy(() => StoreCreateWithoutPromosInputSchema), z.lazy(() => StoreUncheckedCreateWithoutPromosInputSchema) ]),
  where: z.lazy(() => StoreWhereInputSchema).optional(),
});

export const StoreUpdateToOneWithWhereWithoutPromosInputSchema: z.ZodType<Prisma.StoreUpdateToOneWithWhereWithoutPromosInput> = z.strictObject({
  where: z.lazy(() => StoreWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => StoreUpdateWithoutPromosInputSchema), z.lazy(() => StoreUncheckedUpdateWithoutPromosInputSchema) ]),
});

export const StoreUpdateWithoutPromosInputSchema: z.ZodType<Prisma.StoreUpdateWithoutPromosInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo_path: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  receipts: z.lazy(() => ReceiptUpdateManyWithoutStoreNestedInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasUpdateManyWithoutStoreNestedInputSchema).optional(),
});

export const StoreUncheckedUpdateWithoutPromosInputSchema: z.ZodType<Prisma.StoreUncheckedUpdateWithoutPromosInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo_path: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  receipts: z.lazy(() => ReceiptUncheckedUpdateManyWithoutStoreNestedInputSchema).optional(),
  aliases: z.lazy(() => StoreAliasUncheckedUpdateManyWithoutStoreNestedInputSchema).optional(),
});

export const UserPromoUpsertWithWhereUniqueWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoUpsertWithWhereUniqueWithoutPromoInput> = z.strictObject({
  where: z.lazy(() => UserPromoWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => UserPromoUpdateWithoutPromoInputSchema), z.lazy(() => UserPromoUncheckedUpdateWithoutPromoInputSchema) ]),
  create: z.union([ z.lazy(() => UserPromoCreateWithoutPromoInputSchema), z.lazy(() => UserPromoUncheckedCreateWithoutPromoInputSchema) ]),
});

export const UserPromoUpdateWithWhereUniqueWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoUpdateWithWhereUniqueWithoutPromoInput> = z.strictObject({
  where: z.lazy(() => UserPromoWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => UserPromoUpdateWithoutPromoInputSchema), z.lazy(() => UserPromoUncheckedUpdateWithoutPromoInputSchema) ]),
});

export const UserPromoUpdateManyWithWhereWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoUpdateManyWithWhereWithoutPromoInput> = z.strictObject({
  where: z.lazy(() => UserPromoScalarWhereInputSchema),
  data: z.union([ z.lazy(() => UserPromoUpdateManyMutationInputSchema), z.lazy(() => UserPromoUncheckedUpdateManyWithoutPromoInputSchema) ]),
});

export const UserCreateWithoutUserPromosInputSchema: z.ZodType<Prisma.UserCreateWithoutUserPromosInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  onboarding_completed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  preferences: z.lazy(() => UserPreferencesCreateNestedOneWithoutUserInputSchema).optional(),
  receipts: z.lazy(() => ReceiptCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutUserPromosInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutUserPromosInput> = z.strictObject({
  id: z.cuid().optional(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  onboarding_completed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  preferences: z.lazy(() => UserPreferencesUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  receipts: z.lazy(() => ReceiptUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutUserPromosInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutUserPromosInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutUserPromosInputSchema), z.lazy(() => UserUncheckedCreateWithoutUserPromosInputSchema) ]),
});

export const PromoCreateWithoutUserPromosInputSchema: z.ZodType<Prisma.PromoCreateWithoutUserPromosInput> = z.strictObject({
  id: z.cuid().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  promo_type: z.string(),
  icon_name: z.string().optional().nullable(),
  receipts_required: z.number().int().optional(),
  validity_start: z.coerce.date().optional().nullable(),
  validity_end: z.coerce.date().optional().nullable(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  store: z.lazy(() => StoreCreateNestedOneWithoutPromosInputSchema).optional(),
});

export const PromoUncheckedCreateWithoutUserPromosInputSchema: z.ZodType<Prisma.PromoUncheckedCreateWithoutUserPromosInput> = z.strictObject({
  id: z.cuid().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  promo_type: z.string(),
  store_id: z.string().optional().nullable(),
  icon_name: z.string().optional().nullable(),
  receipts_required: z.number().int().optional(),
  validity_start: z.coerce.date().optional().nullable(),
  validity_end: z.coerce.date().optional().nullable(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
});

export const PromoCreateOrConnectWithoutUserPromosInputSchema: z.ZodType<Prisma.PromoCreateOrConnectWithoutUserPromosInput> = z.strictObject({
  where: z.lazy(() => PromoWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PromoCreateWithoutUserPromosInputSchema), z.lazy(() => PromoUncheckedCreateWithoutUserPromosInputSchema) ]),
});

export const UserUpsertWithoutUserPromosInputSchema: z.ZodType<Prisma.UserUpsertWithoutUserPromosInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutUserPromosInputSchema), z.lazy(() => UserUncheckedUpdateWithoutUserPromosInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutUserPromosInputSchema), z.lazy(() => UserUncheckedCreateWithoutUserPromosInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutUserPromosInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutUserPromosInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutUserPromosInputSchema), z.lazy(() => UserUncheckedUpdateWithoutUserPromosInputSchema) ]),
});

export const UserUpdateWithoutUserPromosInputSchema: z.ZodType<Prisma.UserUpdateWithoutUserPromosInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password_hash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  onboarding_completed: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  preferences: z.lazy(() => UserPreferencesUpdateOneWithoutUserNestedInputSchema).optional(),
  receipts: z.lazy(() => ReceiptUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutUserPromosInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutUserPromosInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password_hash: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  onboarding_completed: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  preferences: z.lazy(() => UserPreferencesUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  receipts: z.lazy(() => ReceiptUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const PromoUpsertWithoutUserPromosInputSchema: z.ZodType<Prisma.PromoUpsertWithoutUserPromosInput> = z.strictObject({
  update: z.union([ z.lazy(() => PromoUpdateWithoutUserPromosInputSchema), z.lazy(() => PromoUncheckedUpdateWithoutUserPromosInputSchema) ]),
  create: z.union([ z.lazy(() => PromoCreateWithoutUserPromosInputSchema), z.lazy(() => PromoUncheckedCreateWithoutUserPromosInputSchema) ]),
  where: z.lazy(() => PromoWhereInputSchema).optional(),
});

export const PromoUpdateToOneWithWhereWithoutUserPromosInputSchema: z.ZodType<Prisma.PromoUpdateToOneWithWhereWithoutUserPromosInput> = z.strictObject({
  where: z.lazy(() => PromoWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PromoUpdateWithoutUserPromosInputSchema), z.lazy(() => PromoUncheckedUpdateWithoutUserPromosInputSchema) ]),
});

export const PromoUpdateWithoutUserPromosInputSchema: z.ZodType<Prisma.PromoUpdateWithoutUserPromosInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  promo_type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipts_required: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validity_start: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validity_end: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_active: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  store: z.lazy(() => StoreUpdateOneWithoutPromosNestedInputSchema).optional(),
});

export const PromoUncheckedUpdateWithoutUserPromosInputSchema: z.ZodType<Prisma.PromoUncheckedUpdateWithoutUserPromosInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  promo_type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipts_required: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validity_start: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validity_end: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_active: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReceiptCreateManyUserInputSchema: z.ZodType<Prisma.ReceiptCreateManyUserInput> = z.strictObject({
  id: z.cuid().optional(),
  store_id: z.string().optional().nullable(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const UserPromoCreateManyUserInputSchema: z.ZodType<Prisma.UserPromoCreateManyUserInput> = z.strictObject({
  id: z.cuid().optional(),
  promo_id: z.string(),
  is_available: z.boolean().optional(),
  redeemed_at: z.coerce.date().optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptUpdateWithoutUserInputSchema: z.ZodType<Prisma.ReceiptUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  store: z.lazy(() => StoreUpdateOneWithoutReceiptsNestedInputSchema).optional(),
  items: z.lazy(() => ReceiptItemUpdateManyWithoutReceiptNestedInputSchema).optional(),
});

export const ReceiptUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.ReceiptUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  items: z.lazy(() => ReceiptItemUncheckedUpdateManyWithoutReceiptNestedInputSchema).optional(),
});

export const ReceiptUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.ReceiptUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserPromoUpdateWithoutUserInputSchema: z.ZodType<Prisma.UserPromoUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  is_available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  redeemed_at: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  promo: z.lazy(() => PromoUpdateOneRequiredWithoutUserPromosNestedInputSchema).optional(),
});

export const UserPromoUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.UserPromoUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  promo_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  is_available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  redeemed_at: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const UserPromoUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.UserPromoUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  promo_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  is_available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  redeemed_at: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptCreateManyStoreInputSchema: z.ZodType<Prisma.ReceiptCreateManyStoreInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  store_name_raw: z.string().optional().nullable(),
  receipt_date: z.coerce.date().optional().nullable(),
  currency_code: z.string().optional(),
  subtotal: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  tax_rate: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_last4: z.string().optional().nullable(),
  scanned_text: z.string().optional().nullable(),
  image_uri: z.string().optional().nullable(),
  storage: z.string().optional(),
  status: z.string().optional(),
  error_message: z.string().optional().nullable(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const PromoCreateManyStoreInputSchema: z.ZodType<Prisma.PromoCreateManyStoreInput> = z.strictObject({
  id: z.cuid().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  promo_type: z.string(),
  icon_name: z.string().optional().nullable(),
  receipts_required: z.number().int().optional(),
  validity_start: z.coerce.date().optional().nullable(),
  validity_end: z.coerce.date().optional().nullable(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
});

export const StoreAliasCreateManyStoreInputSchema: z.ZodType<Prisma.StoreAliasCreateManyStoreInput> = z.strictObject({
  id: z.cuid().optional(),
  alias: z.string(),
});

export const ReceiptUpdateWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptUpdateWithoutStoreInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutReceiptsNestedInputSchema).optional(),
  items: z.lazy(() => ReceiptItemUpdateManyWithoutReceiptNestedInputSchema).optional(),
});

export const ReceiptUncheckedUpdateWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptUncheckedUpdateWithoutStoreInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  items: z.lazy(() => ReceiptItemUncheckedUpdateManyWithoutReceiptNestedInputSchema).optional(),
});

export const ReceiptUncheckedUpdateManyWithoutStoreInputSchema: z.ZodType<Prisma.ReceiptUncheckedUpdateManyWithoutStoreInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  store_name_raw: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipt_date: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  currency_code: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tax_rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_method: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payment_last4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scanned_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_uri: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  storage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error_message: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updated_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PromoUpdateWithoutStoreInputSchema: z.ZodType<Prisma.PromoUpdateWithoutStoreInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  promo_type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipts_required: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validity_start: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validity_end: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_active: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userPromos: z.lazy(() => UserPromoUpdateManyWithoutPromoNestedInputSchema).optional(),
});

export const PromoUncheckedUpdateWithoutStoreInputSchema: z.ZodType<Prisma.PromoUncheckedUpdateWithoutStoreInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  promo_type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipts_required: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validity_start: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validity_end: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_active: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userPromos: z.lazy(() => UserPromoUncheckedUpdateManyWithoutPromoNestedInputSchema).optional(),
});

export const PromoUncheckedUpdateManyWithoutStoreInputSchema: z.ZodType<Prisma.PromoUncheckedUpdateManyWithoutStoreInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  promo_type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  receipts_required: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  validity_start: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  validity_end: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_active: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  created_at: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StoreAliasUpdateWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasUpdateWithoutStoreInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  alias: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StoreAliasUncheckedUpdateWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasUncheckedUpdateWithoutStoreInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  alias: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StoreAliasUncheckedUpdateManyWithoutStoreInputSchema: z.ZodType<Prisma.StoreAliasUncheckedUpdateManyWithoutStoreInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  alias: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ReceiptItemCreateManyReceiptInputSchema: z.ZodType<Prisma.ReceiptItemCreateManyReceiptInput> = z.strictObject({
  id: z.cuid().optional(),
  line_number: z.number().int().optional().nullable(),
  original_text: z.string().optional().nullable(),
  product_name: z.string().optional().nullable(),
  quantity: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  unit: z.string().optional().nullable(),
  unit_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  total_price: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  matched: z.boolean().optional(),
  match_score: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  qdrant_collection: z.string().optional().nullable(),
  qdrant_point_id: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  factor_co2_per_unit: z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional().nullable(),
  factor_unit: z.string().optional().nullable(),
  factor_source: z.string().optional().nullable(),
  factor_version: z.string().optional().nullable(),
  is_eco_flag: z.boolean().optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptItemUpdateWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemUpdateWithoutReceiptInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  line_number: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  original_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  product_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  quantity: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  matched: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  match_score: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_collection: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_point_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subcategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_source: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_version: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_eco_flag: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptItemUncheckedUpdateWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemUncheckedUpdateWithoutReceiptInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  line_number: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  original_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  product_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  quantity: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  matched: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  match_score: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_collection: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_point_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subcategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_source: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_version: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_eco_flag: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const ReceiptItemUncheckedUpdateManyWithoutReceiptInputSchema: z.ZodType<Prisma.ReceiptItemUncheckedUpdateManyWithoutReceiptInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  line_number: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  original_text: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  product_name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  quantity: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  unit_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  total_price: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  matched: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  match_score: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_collection: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qdrant_point_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  brand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subcategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_co2_per_unit: z.union([ z.union([z.number(),z.string(),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NullableDecimalFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_unit: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_source: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  factor_version: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  is_eco_flag: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  flags: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const UserPromoCreateManyPromoInputSchema: z.ZodType<Prisma.UserPromoCreateManyPromoInput> = z.strictObject({
  id: z.cuid().optional(),
  user_id: z.string(),
  is_available: z.boolean().optional(),
  redeemed_at: z.coerce.date().optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const UserPromoUpdateWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoUpdateWithoutPromoInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  is_available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  redeemed_at: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutUserPromosNestedInputSchema).optional(),
});

export const UserPromoUncheckedUpdateWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoUncheckedUpdateWithoutPromoInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  is_available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  redeemed_at: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

export const UserPromoUncheckedUpdateManyWithoutPromoInputSchema: z.ZodType<Prisma.UserPromoUncheckedUpdateManyWithoutPromoInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user_id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  is_available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  redeemed_at: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
});

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(), UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(), 
  having: UserScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserPreferencesFindFirstArgsSchema: z.ZodType<Prisma.UserPreferencesFindFirstArgs> = z.object({
  select: UserPreferencesSelectSchema.optional(),
  include: UserPreferencesIncludeSchema.optional(),
  where: UserPreferencesWhereInputSchema.optional(), 
  orderBy: z.union([ UserPreferencesOrderByWithRelationInputSchema.array(), UserPreferencesOrderByWithRelationInputSchema ]).optional(),
  cursor: UserPreferencesWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserPreferencesScalarFieldEnumSchema, UserPreferencesScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserPreferencesFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserPreferencesFindFirstOrThrowArgs> = z.object({
  select: UserPreferencesSelectSchema.optional(),
  include: UserPreferencesIncludeSchema.optional(),
  where: UserPreferencesWhereInputSchema.optional(), 
  orderBy: z.union([ UserPreferencesOrderByWithRelationInputSchema.array(), UserPreferencesOrderByWithRelationInputSchema ]).optional(),
  cursor: UserPreferencesWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserPreferencesScalarFieldEnumSchema, UserPreferencesScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserPreferencesFindManyArgsSchema: z.ZodType<Prisma.UserPreferencesFindManyArgs> = z.object({
  select: UserPreferencesSelectSchema.optional(),
  include: UserPreferencesIncludeSchema.optional(),
  where: UserPreferencesWhereInputSchema.optional(), 
  orderBy: z.union([ UserPreferencesOrderByWithRelationInputSchema.array(), UserPreferencesOrderByWithRelationInputSchema ]).optional(),
  cursor: UserPreferencesWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserPreferencesScalarFieldEnumSchema, UserPreferencesScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserPreferencesAggregateArgsSchema: z.ZodType<Prisma.UserPreferencesAggregateArgs> = z.object({
  where: UserPreferencesWhereInputSchema.optional(), 
  orderBy: z.union([ UserPreferencesOrderByWithRelationInputSchema.array(), UserPreferencesOrderByWithRelationInputSchema ]).optional(),
  cursor: UserPreferencesWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserPreferencesGroupByArgsSchema: z.ZodType<Prisma.UserPreferencesGroupByArgs> = z.object({
  where: UserPreferencesWhereInputSchema.optional(), 
  orderBy: z.union([ UserPreferencesOrderByWithAggregationInputSchema.array(), UserPreferencesOrderByWithAggregationInputSchema ]).optional(),
  by: UserPreferencesScalarFieldEnumSchema.array(), 
  having: UserPreferencesScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserPreferencesFindUniqueArgsSchema: z.ZodType<Prisma.UserPreferencesFindUniqueArgs> = z.object({
  select: UserPreferencesSelectSchema.optional(),
  include: UserPreferencesIncludeSchema.optional(),
  where: UserPreferencesWhereUniqueInputSchema, 
}).strict();

export const UserPreferencesFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserPreferencesFindUniqueOrThrowArgs> = z.object({
  select: UserPreferencesSelectSchema.optional(),
  include: UserPreferencesIncludeSchema.optional(),
  where: UserPreferencesWhereUniqueInputSchema, 
}).strict();

export const StoreFindFirstArgsSchema: z.ZodType<Prisma.StoreFindFirstArgs> = z.object({
  select: StoreSelectSchema.optional(),
  include: StoreIncludeSchema.optional(),
  where: StoreWhereInputSchema.optional(), 
  orderBy: z.union([ StoreOrderByWithRelationInputSchema.array(), StoreOrderByWithRelationInputSchema ]).optional(),
  cursor: StoreWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StoreScalarFieldEnumSchema, StoreScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const StoreFindFirstOrThrowArgsSchema: z.ZodType<Prisma.StoreFindFirstOrThrowArgs> = z.object({
  select: StoreSelectSchema.optional(),
  include: StoreIncludeSchema.optional(),
  where: StoreWhereInputSchema.optional(), 
  orderBy: z.union([ StoreOrderByWithRelationInputSchema.array(), StoreOrderByWithRelationInputSchema ]).optional(),
  cursor: StoreWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StoreScalarFieldEnumSchema, StoreScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const StoreFindManyArgsSchema: z.ZodType<Prisma.StoreFindManyArgs> = z.object({
  select: StoreSelectSchema.optional(),
  include: StoreIncludeSchema.optional(),
  where: StoreWhereInputSchema.optional(), 
  orderBy: z.union([ StoreOrderByWithRelationInputSchema.array(), StoreOrderByWithRelationInputSchema ]).optional(),
  cursor: StoreWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StoreScalarFieldEnumSchema, StoreScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const StoreAggregateArgsSchema: z.ZodType<Prisma.StoreAggregateArgs> = z.object({
  where: StoreWhereInputSchema.optional(), 
  orderBy: z.union([ StoreOrderByWithRelationInputSchema.array(), StoreOrderByWithRelationInputSchema ]).optional(),
  cursor: StoreWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const StoreGroupByArgsSchema: z.ZodType<Prisma.StoreGroupByArgs> = z.object({
  where: StoreWhereInputSchema.optional(), 
  orderBy: z.union([ StoreOrderByWithAggregationInputSchema.array(), StoreOrderByWithAggregationInputSchema ]).optional(),
  by: StoreScalarFieldEnumSchema.array(), 
  having: StoreScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const StoreFindUniqueArgsSchema: z.ZodType<Prisma.StoreFindUniqueArgs> = z.object({
  select: StoreSelectSchema.optional(),
  include: StoreIncludeSchema.optional(),
  where: StoreWhereUniqueInputSchema, 
}).strict();

export const StoreFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.StoreFindUniqueOrThrowArgs> = z.object({
  select: StoreSelectSchema.optional(),
  include: StoreIncludeSchema.optional(),
  where: StoreWhereUniqueInputSchema, 
}).strict();

export const StoreAliasFindFirstArgsSchema: z.ZodType<Prisma.StoreAliasFindFirstArgs> = z.object({
  select: StoreAliasSelectSchema.optional(),
  include: StoreAliasIncludeSchema.optional(),
  where: StoreAliasWhereInputSchema.optional(), 
  orderBy: z.union([ StoreAliasOrderByWithRelationInputSchema.array(), StoreAliasOrderByWithRelationInputSchema ]).optional(),
  cursor: StoreAliasWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StoreAliasScalarFieldEnumSchema, StoreAliasScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const StoreAliasFindFirstOrThrowArgsSchema: z.ZodType<Prisma.StoreAliasFindFirstOrThrowArgs> = z.object({
  select: StoreAliasSelectSchema.optional(),
  include: StoreAliasIncludeSchema.optional(),
  where: StoreAliasWhereInputSchema.optional(), 
  orderBy: z.union([ StoreAliasOrderByWithRelationInputSchema.array(), StoreAliasOrderByWithRelationInputSchema ]).optional(),
  cursor: StoreAliasWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StoreAliasScalarFieldEnumSchema, StoreAliasScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const StoreAliasFindManyArgsSchema: z.ZodType<Prisma.StoreAliasFindManyArgs> = z.object({
  select: StoreAliasSelectSchema.optional(),
  include: StoreAliasIncludeSchema.optional(),
  where: StoreAliasWhereInputSchema.optional(), 
  orderBy: z.union([ StoreAliasOrderByWithRelationInputSchema.array(), StoreAliasOrderByWithRelationInputSchema ]).optional(),
  cursor: StoreAliasWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StoreAliasScalarFieldEnumSchema, StoreAliasScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const StoreAliasAggregateArgsSchema: z.ZodType<Prisma.StoreAliasAggregateArgs> = z.object({
  where: StoreAliasWhereInputSchema.optional(), 
  orderBy: z.union([ StoreAliasOrderByWithRelationInputSchema.array(), StoreAliasOrderByWithRelationInputSchema ]).optional(),
  cursor: StoreAliasWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const StoreAliasGroupByArgsSchema: z.ZodType<Prisma.StoreAliasGroupByArgs> = z.object({
  where: StoreAliasWhereInputSchema.optional(), 
  orderBy: z.union([ StoreAliasOrderByWithAggregationInputSchema.array(), StoreAliasOrderByWithAggregationInputSchema ]).optional(),
  by: StoreAliasScalarFieldEnumSchema.array(), 
  having: StoreAliasScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const StoreAliasFindUniqueArgsSchema: z.ZodType<Prisma.StoreAliasFindUniqueArgs> = z.object({
  select: StoreAliasSelectSchema.optional(),
  include: StoreAliasIncludeSchema.optional(),
  where: StoreAliasWhereUniqueInputSchema, 
}).strict();

export const StoreAliasFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.StoreAliasFindUniqueOrThrowArgs> = z.object({
  select: StoreAliasSelectSchema.optional(),
  include: StoreAliasIncludeSchema.optional(),
  where: StoreAliasWhereUniqueInputSchema, 
}).strict();

export const ReceiptFindFirstArgsSchema: z.ZodType<Prisma.ReceiptFindFirstArgs> = z.object({
  select: ReceiptSelectSchema.optional(),
  include: ReceiptIncludeSchema.optional(),
  where: ReceiptWhereInputSchema.optional(), 
  orderBy: z.union([ ReceiptOrderByWithRelationInputSchema.array(), ReceiptOrderByWithRelationInputSchema ]).optional(),
  cursor: ReceiptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReceiptScalarFieldEnumSchema, ReceiptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReceiptFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ReceiptFindFirstOrThrowArgs> = z.object({
  select: ReceiptSelectSchema.optional(),
  include: ReceiptIncludeSchema.optional(),
  where: ReceiptWhereInputSchema.optional(), 
  orderBy: z.union([ ReceiptOrderByWithRelationInputSchema.array(), ReceiptOrderByWithRelationInputSchema ]).optional(),
  cursor: ReceiptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReceiptScalarFieldEnumSchema, ReceiptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReceiptFindManyArgsSchema: z.ZodType<Prisma.ReceiptFindManyArgs> = z.object({
  select: ReceiptSelectSchema.optional(),
  include: ReceiptIncludeSchema.optional(),
  where: ReceiptWhereInputSchema.optional(), 
  orderBy: z.union([ ReceiptOrderByWithRelationInputSchema.array(), ReceiptOrderByWithRelationInputSchema ]).optional(),
  cursor: ReceiptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReceiptScalarFieldEnumSchema, ReceiptScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReceiptAggregateArgsSchema: z.ZodType<Prisma.ReceiptAggregateArgs> = z.object({
  where: ReceiptWhereInputSchema.optional(), 
  orderBy: z.union([ ReceiptOrderByWithRelationInputSchema.array(), ReceiptOrderByWithRelationInputSchema ]).optional(),
  cursor: ReceiptWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ReceiptGroupByArgsSchema: z.ZodType<Prisma.ReceiptGroupByArgs> = z.object({
  where: ReceiptWhereInputSchema.optional(), 
  orderBy: z.union([ ReceiptOrderByWithAggregationInputSchema.array(), ReceiptOrderByWithAggregationInputSchema ]).optional(),
  by: ReceiptScalarFieldEnumSchema.array(), 
  having: ReceiptScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ReceiptFindUniqueArgsSchema: z.ZodType<Prisma.ReceiptFindUniqueArgs> = z.object({
  select: ReceiptSelectSchema.optional(),
  include: ReceiptIncludeSchema.optional(),
  where: ReceiptWhereUniqueInputSchema, 
}).strict();

export const ReceiptFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ReceiptFindUniqueOrThrowArgs> = z.object({
  select: ReceiptSelectSchema.optional(),
  include: ReceiptIncludeSchema.optional(),
  where: ReceiptWhereUniqueInputSchema, 
}).strict();

export const ReceiptItemFindFirstArgsSchema: z.ZodType<Prisma.ReceiptItemFindFirstArgs> = z.object({
  select: ReceiptItemSelectSchema.optional(),
  include: ReceiptItemIncludeSchema.optional(),
  where: ReceiptItemWhereInputSchema.optional(), 
  orderBy: z.union([ ReceiptItemOrderByWithRelationInputSchema.array(), ReceiptItemOrderByWithRelationInputSchema ]).optional(),
  cursor: ReceiptItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReceiptItemScalarFieldEnumSchema, ReceiptItemScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReceiptItemFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ReceiptItemFindFirstOrThrowArgs> = z.object({
  select: ReceiptItemSelectSchema.optional(),
  include: ReceiptItemIncludeSchema.optional(),
  where: ReceiptItemWhereInputSchema.optional(), 
  orderBy: z.union([ ReceiptItemOrderByWithRelationInputSchema.array(), ReceiptItemOrderByWithRelationInputSchema ]).optional(),
  cursor: ReceiptItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReceiptItemScalarFieldEnumSchema, ReceiptItemScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReceiptItemFindManyArgsSchema: z.ZodType<Prisma.ReceiptItemFindManyArgs> = z.object({
  select: ReceiptItemSelectSchema.optional(),
  include: ReceiptItemIncludeSchema.optional(),
  where: ReceiptItemWhereInputSchema.optional(), 
  orderBy: z.union([ ReceiptItemOrderByWithRelationInputSchema.array(), ReceiptItemOrderByWithRelationInputSchema ]).optional(),
  cursor: ReceiptItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ReceiptItemScalarFieldEnumSchema, ReceiptItemScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ReceiptItemAggregateArgsSchema: z.ZodType<Prisma.ReceiptItemAggregateArgs> = z.object({
  where: ReceiptItemWhereInputSchema.optional(), 
  orderBy: z.union([ ReceiptItemOrderByWithRelationInputSchema.array(), ReceiptItemOrderByWithRelationInputSchema ]).optional(),
  cursor: ReceiptItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ReceiptItemGroupByArgsSchema: z.ZodType<Prisma.ReceiptItemGroupByArgs> = z.object({
  where: ReceiptItemWhereInputSchema.optional(), 
  orderBy: z.union([ ReceiptItemOrderByWithAggregationInputSchema.array(), ReceiptItemOrderByWithAggregationInputSchema ]).optional(),
  by: ReceiptItemScalarFieldEnumSchema.array(), 
  having: ReceiptItemScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ReceiptItemFindUniqueArgsSchema: z.ZodType<Prisma.ReceiptItemFindUniqueArgs> = z.object({
  select: ReceiptItemSelectSchema.optional(),
  include: ReceiptItemIncludeSchema.optional(),
  where: ReceiptItemWhereUniqueInputSchema, 
}).strict();

export const ReceiptItemFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ReceiptItemFindUniqueOrThrowArgs> = z.object({
  select: ReceiptItemSelectSchema.optional(),
  include: ReceiptItemIncludeSchema.optional(),
  where: ReceiptItemWhereUniqueInputSchema, 
}).strict();

export const PromoFindFirstArgsSchema: z.ZodType<Prisma.PromoFindFirstArgs> = z.object({
  select: PromoSelectSchema.optional(),
  include: PromoIncludeSchema.optional(),
  where: PromoWhereInputSchema.optional(), 
  orderBy: z.union([ PromoOrderByWithRelationInputSchema.array(), PromoOrderByWithRelationInputSchema ]).optional(),
  cursor: PromoWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PromoScalarFieldEnumSchema, PromoScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PromoFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PromoFindFirstOrThrowArgs> = z.object({
  select: PromoSelectSchema.optional(),
  include: PromoIncludeSchema.optional(),
  where: PromoWhereInputSchema.optional(), 
  orderBy: z.union([ PromoOrderByWithRelationInputSchema.array(), PromoOrderByWithRelationInputSchema ]).optional(),
  cursor: PromoWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PromoScalarFieldEnumSchema, PromoScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PromoFindManyArgsSchema: z.ZodType<Prisma.PromoFindManyArgs> = z.object({
  select: PromoSelectSchema.optional(),
  include: PromoIncludeSchema.optional(),
  where: PromoWhereInputSchema.optional(), 
  orderBy: z.union([ PromoOrderByWithRelationInputSchema.array(), PromoOrderByWithRelationInputSchema ]).optional(),
  cursor: PromoWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PromoScalarFieldEnumSchema, PromoScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PromoAggregateArgsSchema: z.ZodType<Prisma.PromoAggregateArgs> = z.object({
  where: PromoWhereInputSchema.optional(), 
  orderBy: z.union([ PromoOrderByWithRelationInputSchema.array(), PromoOrderByWithRelationInputSchema ]).optional(),
  cursor: PromoWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PromoGroupByArgsSchema: z.ZodType<Prisma.PromoGroupByArgs> = z.object({
  where: PromoWhereInputSchema.optional(), 
  orderBy: z.union([ PromoOrderByWithAggregationInputSchema.array(), PromoOrderByWithAggregationInputSchema ]).optional(),
  by: PromoScalarFieldEnumSchema.array(), 
  having: PromoScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PromoFindUniqueArgsSchema: z.ZodType<Prisma.PromoFindUniqueArgs> = z.object({
  select: PromoSelectSchema.optional(),
  include: PromoIncludeSchema.optional(),
  where: PromoWhereUniqueInputSchema, 
}).strict();

export const PromoFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PromoFindUniqueOrThrowArgs> = z.object({
  select: PromoSelectSchema.optional(),
  include: PromoIncludeSchema.optional(),
  where: PromoWhereUniqueInputSchema, 
}).strict();

export const UserPromoFindFirstArgsSchema: z.ZodType<Prisma.UserPromoFindFirstArgs> = z.object({
  select: UserPromoSelectSchema.optional(),
  include: UserPromoIncludeSchema.optional(),
  where: UserPromoWhereInputSchema.optional(), 
  orderBy: z.union([ UserPromoOrderByWithRelationInputSchema.array(), UserPromoOrderByWithRelationInputSchema ]).optional(),
  cursor: UserPromoWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserPromoScalarFieldEnumSchema, UserPromoScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserPromoFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserPromoFindFirstOrThrowArgs> = z.object({
  select: UserPromoSelectSchema.optional(),
  include: UserPromoIncludeSchema.optional(),
  where: UserPromoWhereInputSchema.optional(), 
  orderBy: z.union([ UserPromoOrderByWithRelationInputSchema.array(), UserPromoOrderByWithRelationInputSchema ]).optional(),
  cursor: UserPromoWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserPromoScalarFieldEnumSchema, UserPromoScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserPromoFindManyArgsSchema: z.ZodType<Prisma.UserPromoFindManyArgs> = z.object({
  select: UserPromoSelectSchema.optional(),
  include: UserPromoIncludeSchema.optional(),
  where: UserPromoWhereInputSchema.optional(), 
  orderBy: z.union([ UserPromoOrderByWithRelationInputSchema.array(), UserPromoOrderByWithRelationInputSchema ]).optional(),
  cursor: UserPromoWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserPromoScalarFieldEnumSchema, UserPromoScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserPromoAggregateArgsSchema: z.ZodType<Prisma.UserPromoAggregateArgs> = z.object({
  where: UserPromoWhereInputSchema.optional(), 
  orderBy: z.union([ UserPromoOrderByWithRelationInputSchema.array(), UserPromoOrderByWithRelationInputSchema ]).optional(),
  cursor: UserPromoWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserPromoGroupByArgsSchema: z.ZodType<Prisma.UserPromoGroupByArgs> = z.object({
  where: UserPromoWhereInputSchema.optional(), 
  orderBy: z.union([ UserPromoOrderByWithAggregationInputSchema.array(), UserPromoOrderByWithAggregationInputSchema ]).optional(),
  by: UserPromoScalarFieldEnumSchema.array(), 
  having: UserPromoScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserPromoFindUniqueArgsSchema: z.ZodType<Prisma.UserPromoFindUniqueArgs> = z.object({
  select: UserPromoSelectSchema.optional(),
  include: UserPromoIncludeSchema.optional(),
  where: UserPromoWhereUniqueInputSchema, 
}).strict();

export const UserPromoFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserPromoFindUniqueOrThrowArgs> = z.object({
  select: UserPromoSelectSchema.optional(),
  include: UserPromoIncludeSchema.optional(),
  where: UserPromoWhereUniqueInputSchema, 
}).strict();

export const AuditEventFindFirstArgsSchema: z.ZodType<Prisma.AuditEventFindFirstArgs> = z.object({
  select: AuditEventSelectSchema.optional(),
  where: AuditEventWhereInputSchema.optional(), 
  orderBy: z.union([ AuditEventOrderByWithRelationInputSchema.array(), AuditEventOrderByWithRelationInputSchema ]).optional(),
  cursor: AuditEventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AuditEventScalarFieldEnumSchema, AuditEventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AuditEventFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AuditEventFindFirstOrThrowArgs> = z.object({
  select: AuditEventSelectSchema.optional(),
  where: AuditEventWhereInputSchema.optional(), 
  orderBy: z.union([ AuditEventOrderByWithRelationInputSchema.array(), AuditEventOrderByWithRelationInputSchema ]).optional(),
  cursor: AuditEventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AuditEventScalarFieldEnumSchema, AuditEventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AuditEventFindManyArgsSchema: z.ZodType<Prisma.AuditEventFindManyArgs> = z.object({
  select: AuditEventSelectSchema.optional(),
  where: AuditEventWhereInputSchema.optional(), 
  orderBy: z.union([ AuditEventOrderByWithRelationInputSchema.array(), AuditEventOrderByWithRelationInputSchema ]).optional(),
  cursor: AuditEventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AuditEventScalarFieldEnumSchema, AuditEventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AuditEventAggregateArgsSchema: z.ZodType<Prisma.AuditEventAggregateArgs> = z.object({
  where: AuditEventWhereInputSchema.optional(), 
  orderBy: z.union([ AuditEventOrderByWithRelationInputSchema.array(), AuditEventOrderByWithRelationInputSchema ]).optional(),
  cursor: AuditEventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AuditEventGroupByArgsSchema: z.ZodType<Prisma.AuditEventGroupByArgs> = z.object({
  where: AuditEventWhereInputSchema.optional(), 
  orderBy: z.union([ AuditEventOrderByWithAggregationInputSchema.array(), AuditEventOrderByWithAggregationInputSchema ]).optional(),
  by: AuditEventScalarFieldEnumSchema.array(), 
  having: AuditEventScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AuditEventFindUniqueArgsSchema: z.ZodType<Prisma.AuditEventFindUniqueArgs> = z.object({
  select: AuditEventSelectSchema.optional(),
  where: AuditEventWhereUniqueInputSchema, 
}).strict();

export const AuditEventFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AuditEventFindUniqueOrThrowArgs> = z.object({
  select: AuditEventSelectSchema.optional(),
  where: AuditEventWhereUniqueInputSchema, 
}).strict();

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
}).strict();

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
  create: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
}).strict();

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserPreferencesCreateArgsSchema: z.ZodType<Prisma.UserPreferencesCreateArgs> = z.object({
  select: UserPreferencesSelectSchema.optional(),
  include: UserPreferencesIncludeSchema.optional(),
  data: z.union([ UserPreferencesCreateInputSchema, UserPreferencesUncheckedCreateInputSchema ]),
}).strict();

export const UserPreferencesUpsertArgsSchema: z.ZodType<Prisma.UserPreferencesUpsertArgs> = z.object({
  select: UserPreferencesSelectSchema.optional(),
  include: UserPreferencesIncludeSchema.optional(),
  where: UserPreferencesWhereUniqueInputSchema, 
  create: z.union([ UserPreferencesCreateInputSchema, UserPreferencesUncheckedCreateInputSchema ]),
  update: z.union([ UserPreferencesUpdateInputSchema, UserPreferencesUncheckedUpdateInputSchema ]),
}).strict();

export const UserPreferencesCreateManyArgsSchema: z.ZodType<Prisma.UserPreferencesCreateManyArgs> = z.object({
  data: z.union([ UserPreferencesCreateManyInputSchema, UserPreferencesCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserPreferencesCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserPreferencesCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserPreferencesCreateManyInputSchema, UserPreferencesCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserPreferencesDeleteArgsSchema: z.ZodType<Prisma.UserPreferencesDeleteArgs> = z.object({
  select: UserPreferencesSelectSchema.optional(),
  include: UserPreferencesIncludeSchema.optional(),
  where: UserPreferencesWhereUniqueInputSchema, 
}).strict();

export const UserPreferencesUpdateArgsSchema: z.ZodType<Prisma.UserPreferencesUpdateArgs> = z.object({
  select: UserPreferencesSelectSchema.optional(),
  include: UserPreferencesIncludeSchema.optional(),
  data: z.union([ UserPreferencesUpdateInputSchema, UserPreferencesUncheckedUpdateInputSchema ]),
  where: UserPreferencesWhereUniqueInputSchema, 
}).strict();

export const UserPreferencesUpdateManyArgsSchema: z.ZodType<Prisma.UserPreferencesUpdateManyArgs> = z.object({
  data: z.union([ UserPreferencesUpdateManyMutationInputSchema, UserPreferencesUncheckedUpdateManyInputSchema ]),
  where: UserPreferencesWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserPreferencesUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserPreferencesUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserPreferencesUpdateManyMutationInputSchema, UserPreferencesUncheckedUpdateManyInputSchema ]),
  where: UserPreferencesWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserPreferencesDeleteManyArgsSchema: z.ZodType<Prisma.UserPreferencesDeleteManyArgs> = z.object({
  where: UserPreferencesWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const StoreCreateArgsSchema: z.ZodType<Prisma.StoreCreateArgs> = z.object({
  select: StoreSelectSchema.optional(),
  include: StoreIncludeSchema.optional(),
  data: z.union([ StoreCreateInputSchema, StoreUncheckedCreateInputSchema ]),
}).strict();

export const StoreUpsertArgsSchema: z.ZodType<Prisma.StoreUpsertArgs> = z.object({
  select: StoreSelectSchema.optional(),
  include: StoreIncludeSchema.optional(),
  where: StoreWhereUniqueInputSchema, 
  create: z.union([ StoreCreateInputSchema, StoreUncheckedCreateInputSchema ]),
  update: z.union([ StoreUpdateInputSchema, StoreUncheckedUpdateInputSchema ]),
}).strict();

export const StoreCreateManyArgsSchema: z.ZodType<Prisma.StoreCreateManyArgs> = z.object({
  data: z.union([ StoreCreateManyInputSchema, StoreCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const StoreCreateManyAndReturnArgsSchema: z.ZodType<Prisma.StoreCreateManyAndReturnArgs> = z.object({
  data: z.union([ StoreCreateManyInputSchema, StoreCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const StoreDeleteArgsSchema: z.ZodType<Prisma.StoreDeleteArgs> = z.object({
  select: StoreSelectSchema.optional(),
  include: StoreIncludeSchema.optional(),
  where: StoreWhereUniqueInputSchema, 
}).strict();

export const StoreUpdateArgsSchema: z.ZodType<Prisma.StoreUpdateArgs> = z.object({
  select: StoreSelectSchema.optional(),
  include: StoreIncludeSchema.optional(),
  data: z.union([ StoreUpdateInputSchema, StoreUncheckedUpdateInputSchema ]),
  where: StoreWhereUniqueInputSchema, 
}).strict();

export const StoreUpdateManyArgsSchema: z.ZodType<Prisma.StoreUpdateManyArgs> = z.object({
  data: z.union([ StoreUpdateManyMutationInputSchema, StoreUncheckedUpdateManyInputSchema ]),
  where: StoreWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const StoreUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.StoreUpdateManyAndReturnArgs> = z.object({
  data: z.union([ StoreUpdateManyMutationInputSchema, StoreUncheckedUpdateManyInputSchema ]),
  where: StoreWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const StoreDeleteManyArgsSchema: z.ZodType<Prisma.StoreDeleteManyArgs> = z.object({
  where: StoreWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const StoreAliasCreateArgsSchema: z.ZodType<Prisma.StoreAliasCreateArgs> = z.object({
  select: StoreAliasSelectSchema.optional(),
  include: StoreAliasIncludeSchema.optional(),
  data: z.union([ StoreAliasCreateInputSchema, StoreAliasUncheckedCreateInputSchema ]),
}).strict();

export const StoreAliasUpsertArgsSchema: z.ZodType<Prisma.StoreAliasUpsertArgs> = z.object({
  select: StoreAliasSelectSchema.optional(),
  include: StoreAliasIncludeSchema.optional(),
  where: StoreAliasWhereUniqueInputSchema, 
  create: z.union([ StoreAliasCreateInputSchema, StoreAliasUncheckedCreateInputSchema ]),
  update: z.union([ StoreAliasUpdateInputSchema, StoreAliasUncheckedUpdateInputSchema ]),
}).strict();

export const StoreAliasCreateManyArgsSchema: z.ZodType<Prisma.StoreAliasCreateManyArgs> = z.object({
  data: z.union([ StoreAliasCreateManyInputSchema, StoreAliasCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const StoreAliasCreateManyAndReturnArgsSchema: z.ZodType<Prisma.StoreAliasCreateManyAndReturnArgs> = z.object({
  data: z.union([ StoreAliasCreateManyInputSchema, StoreAliasCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const StoreAliasDeleteArgsSchema: z.ZodType<Prisma.StoreAliasDeleteArgs> = z.object({
  select: StoreAliasSelectSchema.optional(),
  include: StoreAliasIncludeSchema.optional(),
  where: StoreAliasWhereUniqueInputSchema, 
}).strict();

export const StoreAliasUpdateArgsSchema: z.ZodType<Prisma.StoreAliasUpdateArgs> = z.object({
  select: StoreAliasSelectSchema.optional(),
  include: StoreAliasIncludeSchema.optional(),
  data: z.union([ StoreAliasUpdateInputSchema, StoreAliasUncheckedUpdateInputSchema ]),
  where: StoreAliasWhereUniqueInputSchema, 
}).strict();

export const StoreAliasUpdateManyArgsSchema: z.ZodType<Prisma.StoreAliasUpdateManyArgs> = z.object({
  data: z.union([ StoreAliasUpdateManyMutationInputSchema, StoreAliasUncheckedUpdateManyInputSchema ]),
  where: StoreAliasWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const StoreAliasUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.StoreAliasUpdateManyAndReturnArgs> = z.object({
  data: z.union([ StoreAliasUpdateManyMutationInputSchema, StoreAliasUncheckedUpdateManyInputSchema ]),
  where: StoreAliasWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const StoreAliasDeleteManyArgsSchema: z.ZodType<Prisma.StoreAliasDeleteManyArgs> = z.object({
  where: StoreAliasWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReceiptCreateArgsSchema: z.ZodType<Prisma.ReceiptCreateArgs> = z.object({
  select: ReceiptSelectSchema.optional(),
  include: ReceiptIncludeSchema.optional(),
  data: z.union([ ReceiptCreateInputSchema, ReceiptUncheckedCreateInputSchema ]),
}).strict();

export const ReceiptUpsertArgsSchema: z.ZodType<Prisma.ReceiptUpsertArgs> = z.object({
  select: ReceiptSelectSchema.optional(),
  include: ReceiptIncludeSchema.optional(),
  where: ReceiptWhereUniqueInputSchema, 
  create: z.union([ ReceiptCreateInputSchema, ReceiptUncheckedCreateInputSchema ]),
  update: z.union([ ReceiptUpdateInputSchema, ReceiptUncheckedUpdateInputSchema ]),
}).strict();

export const ReceiptCreateManyArgsSchema: z.ZodType<Prisma.ReceiptCreateManyArgs> = z.object({
  data: z.union([ ReceiptCreateManyInputSchema, ReceiptCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ReceiptCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ReceiptCreateManyAndReturnArgs> = z.object({
  data: z.union([ ReceiptCreateManyInputSchema, ReceiptCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ReceiptDeleteArgsSchema: z.ZodType<Prisma.ReceiptDeleteArgs> = z.object({
  select: ReceiptSelectSchema.optional(),
  include: ReceiptIncludeSchema.optional(),
  where: ReceiptWhereUniqueInputSchema, 
}).strict();

export const ReceiptUpdateArgsSchema: z.ZodType<Prisma.ReceiptUpdateArgs> = z.object({
  select: ReceiptSelectSchema.optional(),
  include: ReceiptIncludeSchema.optional(),
  data: z.union([ ReceiptUpdateInputSchema, ReceiptUncheckedUpdateInputSchema ]),
  where: ReceiptWhereUniqueInputSchema, 
}).strict();

export const ReceiptUpdateManyArgsSchema: z.ZodType<Prisma.ReceiptUpdateManyArgs> = z.object({
  data: z.union([ ReceiptUpdateManyMutationInputSchema, ReceiptUncheckedUpdateManyInputSchema ]),
  where: ReceiptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReceiptUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ReceiptUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ReceiptUpdateManyMutationInputSchema, ReceiptUncheckedUpdateManyInputSchema ]),
  where: ReceiptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReceiptDeleteManyArgsSchema: z.ZodType<Prisma.ReceiptDeleteManyArgs> = z.object({
  where: ReceiptWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReceiptItemCreateArgsSchema: z.ZodType<Prisma.ReceiptItemCreateArgs> = z.object({
  select: ReceiptItemSelectSchema.optional(),
  include: ReceiptItemIncludeSchema.optional(),
  data: z.union([ ReceiptItemCreateInputSchema, ReceiptItemUncheckedCreateInputSchema ]),
}).strict();

export const ReceiptItemUpsertArgsSchema: z.ZodType<Prisma.ReceiptItemUpsertArgs> = z.object({
  select: ReceiptItemSelectSchema.optional(),
  include: ReceiptItemIncludeSchema.optional(),
  where: ReceiptItemWhereUniqueInputSchema, 
  create: z.union([ ReceiptItemCreateInputSchema, ReceiptItemUncheckedCreateInputSchema ]),
  update: z.union([ ReceiptItemUpdateInputSchema, ReceiptItemUncheckedUpdateInputSchema ]),
}).strict();

export const ReceiptItemCreateManyArgsSchema: z.ZodType<Prisma.ReceiptItemCreateManyArgs> = z.object({
  data: z.union([ ReceiptItemCreateManyInputSchema, ReceiptItemCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ReceiptItemCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ReceiptItemCreateManyAndReturnArgs> = z.object({
  data: z.union([ ReceiptItemCreateManyInputSchema, ReceiptItemCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ReceiptItemDeleteArgsSchema: z.ZodType<Prisma.ReceiptItemDeleteArgs> = z.object({
  select: ReceiptItemSelectSchema.optional(),
  include: ReceiptItemIncludeSchema.optional(),
  where: ReceiptItemWhereUniqueInputSchema, 
}).strict();

export const ReceiptItemUpdateArgsSchema: z.ZodType<Prisma.ReceiptItemUpdateArgs> = z.object({
  select: ReceiptItemSelectSchema.optional(),
  include: ReceiptItemIncludeSchema.optional(),
  data: z.union([ ReceiptItemUpdateInputSchema, ReceiptItemUncheckedUpdateInputSchema ]),
  where: ReceiptItemWhereUniqueInputSchema, 
}).strict();

export const ReceiptItemUpdateManyArgsSchema: z.ZodType<Prisma.ReceiptItemUpdateManyArgs> = z.object({
  data: z.union([ ReceiptItemUpdateManyMutationInputSchema, ReceiptItemUncheckedUpdateManyInputSchema ]),
  where: ReceiptItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReceiptItemUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ReceiptItemUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ReceiptItemUpdateManyMutationInputSchema, ReceiptItemUncheckedUpdateManyInputSchema ]),
  where: ReceiptItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ReceiptItemDeleteManyArgsSchema: z.ZodType<Prisma.ReceiptItemDeleteManyArgs> = z.object({
  where: ReceiptItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PromoCreateArgsSchema: z.ZodType<Prisma.PromoCreateArgs> = z.object({
  select: PromoSelectSchema.optional(),
  include: PromoIncludeSchema.optional(),
  data: z.union([ PromoCreateInputSchema, PromoUncheckedCreateInputSchema ]),
}).strict();

export const PromoUpsertArgsSchema: z.ZodType<Prisma.PromoUpsertArgs> = z.object({
  select: PromoSelectSchema.optional(),
  include: PromoIncludeSchema.optional(),
  where: PromoWhereUniqueInputSchema, 
  create: z.union([ PromoCreateInputSchema, PromoUncheckedCreateInputSchema ]),
  update: z.union([ PromoUpdateInputSchema, PromoUncheckedUpdateInputSchema ]),
}).strict();

export const PromoCreateManyArgsSchema: z.ZodType<Prisma.PromoCreateManyArgs> = z.object({
  data: z.union([ PromoCreateManyInputSchema, PromoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PromoCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PromoCreateManyAndReturnArgs> = z.object({
  data: z.union([ PromoCreateManyInputSchema, PromoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PromoDeleteArgsSchema: z.ZodType<Prisma.PromoDeleteArgs> = z.object({
  select: PromoSelectSchema.optional(),
  include: PromoIncludeSchema.optional(),
  where: PromoWhereUniqueInputSchema, 
}).strict();

export const PromoUpdateArgsSchema: z.ZodType<Prisma.PromoUpdateArgs> = z.object({
  select: PromoSelectSchema.optional(),
  include: PromoIncludeSchema.optional(),
  data: z.union([ PromoUpdateInputSchema, PromoUncheckedUpdateInputSchema ]),
  where: PromoWhereUniqueInputSchema, 
}).strict();

export const PromoUpdateManyArgsSchema: z.ZodType<Prisma.PromoUpdateManyArgs> = z.object({
  data: z.union([ PromoUpdateManyMutationInputSchema, PromoUncheckedUpdateManyInputSchema ]),
  where: PromoWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PromoUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PromoUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PromoUpdateManyMutationInputSchema, PromoUncheckedUpdateManyInputSchema ]),
  where: PromoWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PromoDeleteManyArgsSchema: z.ZodType<Prisma.PromoDeleteManyArgs> = z.object({
  where: PromoWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserPromoCreateArgsSchema: z.ZodType<Prisma.UserPromoCreateArgs> = z.object({
  select: UserPromoSelectSchema.optional(),
  include: UserPromoIncludeSchema.optional(),
  data: z.union([ UserPromoCreateInputSchema, UserPromoUncheckedCreateInputSchema ]),
}).strict();

export const UserPromoUpsertArgsSchema: z.ZodType<Prisma.UserPromoUpsertArgs> = z.object({
  select: UserPromoSelectSchema.optional(),
  include: UserPromoIncludeSchema.optional(),
  where: UserPromoWhereUniqueInputSchema, 
  create: z.union([ UserPromoCreateInputSchema, UserPromoUncheckedCreateInputSchema ]),
  update: z.union([ UserPromoUpdateInputSchema, UserPromoUncheckedUpdateInputSchema ]),
}).strict();

export const UserPromoCreateManyArgsSchema: z.ZodType<Prisma.UserPromoCreateManyArgs> = z.object({
  data: z.union([ UserPromoCreateManyInputSchema, UserPromoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserPromoCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserPromoCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserPromoCreateManyInputSchema, UserPromoCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserPromoDeleteArgsSchema: z.ZodType<Prisma.UserPromoDeleteArgs> = z.object({
  select: UserPromoSelectSchema.optional(),
  include: UserPromoIncludeSchema.optional(),
  where: UserPromoWhereUniqueInputSchema, 
}).strict();

export const UserPromoUpdateArgsSchema: z.ZodType<Prisma.UserPromoUpdateArgs> = z.object({
  select: UserPromoSelectSchema.optional(),
  include: UserPromoIncludeSchema.optional(),
  data: z.union([ UserPromoUpdateInputSchema, UserPromoUncheckedUpdateInputSchema ]),
  where: UserPromoWhereUniqueInputSchema, 
}).strict();

export const UserPromoUpdateManyArgsSchema: z.ZodType<Prisma.UserPromoUpdateManyArgs> = z.object({
  data: z.union([ UserPromoUpdateManyMutationInputSchema, UserPromoUncheckedUpdateManyInputSchema ]),
  where: UserPromoWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserPromoUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserPromoUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserPromoUpdateManyMutationInputSchema, UserPromoUncheckedUpdateManyInputSchema ]),
  where: UserPromoWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserPromoDeleteManyArgsSchema: z.ZodType<Prisma.UserPromoDeleteManyArgs> = z.object({
  where: UserPromoWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AuditEventCreateArgsSchema: z.ZodType<Prisma.AuditEventCreateArgs> = z.object({
  select: AuditEventSelectSchema.optional(),
  data: z.union([ AuditEventCreateInputSchema, AuditEventUncheckedCreateInputSchema ]),
}).strict();

export const AuditEventUpsertArgsSchema: z.ZodType<Prisma.AuditEventUpsertArgs> = z.object({
  select: AuditEventSelectSchema.optional(),
  where: AuditEventWhereUniqueInputSchema, 
  create: z.union([ AuditEventCreateInputSchema, AuditEventUncheckedCreateInputSchema ]),
  update: z.union([ AuditEventUpdateInputSchema, AuditEventUncheckedUpdateInputSchema ]),
}).strict();

export const AuditEventCreateManyArgsSchema: z.ZodType<Prisma.AuditEventCreateManyArgs> = z.object({
  data: z.union([ AuditEventCreateManyInputSchema, AuditEventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AuditEventCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AuditEventCreateManyAndReturnArgs> = z.object({
  data: z.union([ AuditEventCreateManyInputSchema, AuditEventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AuditEventDeleteArgsSchema: z.ZodType<Prisma.AuditEventDeleteArgs> = z.object({
  select: AuditEventSelectSchema.optional(),
  where: AuditEventWhereUniqueInputSchema, 
}).strict();

export const AuditEventUpdateArgsSchema: z.ZodType<Prisma.AuditEventUpdateArgs> = z.object({
  select: AuditEventSelectSchema.optional(),
  data: z.union([ AuditEventUpdateInputSchema, AuditEventUncheckedUpdateInputSchema ]),
  where: AuditEventWhereUniqueInputSchema, 
}).strict();

export const AuditEventUpdateManyArgsSchema: z.ZodType<Prisma.AuditEventUpdateManyArgs> = z.object({
  data: z.union([ AuditEventUpdateManyMutationInputSchema, AuditEventUncheckedUpdateManyInputSchema ]),
  where: AuditEventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AuditEventUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AuditEventUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AuditEventUpdateManyMutationInputSchema, AuditEventUncheckedUpdateManyInputSchema ]),
  where: AuditEventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AuditEventDeleteManyArgsSchema: z.ZodType<Prisma.AuditEventDeleteManyArgs> = z.object({
  where: AuditEventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();