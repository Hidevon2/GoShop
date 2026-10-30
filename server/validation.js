import { z } from "zod";
import { parse } from "csv-parse/sync";
export const email = z.string().trim().toLowerCase().email().max(200);
export const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(100);
export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(100),
});
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
  phone: z.string().trim().max(30).default(""),
});
export const productSchema = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z0-9-]{3,40}$/,
      "SKU must contain 3–40 letters, numbers or hyphens.",
    ),
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).default(""),
  category_id: z.string().min(1).max(100),
  price_cents: z.number().int().min(1).max(100000000),
  cost_cents: z.number().int().min(0).max(100000000).default(0),
  stock: z.number().int().min(0).max(1000000).default(0),
  reorder_level: z.number().int().min(0).max(1000000).default(10),
  image_url: z
    .string()
    .max(1000)
    .refine(
      (v) =>
        !v ||
        /^\/products\/[a-z0-9.-]+$/i.test(v) ||
        /^https:\/\/[a-z0-9.-]+\//i.test(v),
      "Use an HTTPS image URL.",
    )
    .default(""),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#eeeaf6"),
  active: z.boolean().default(true),
});
export const checkoutSchema = z
  .object({
    channel: z.enum(["online", "pos"]),
    idempotencyKey: z.string().min(8).max(100),
    expectedTotalCents: z.number().int().min(0).max(2000000000).optional(),
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().max(30).default(""),
    address: z.string().trim().max(500).default(""),
    items: z
      .array(
        z.object({
          productId: z.string().min(1).max(100),
          quantity: z.number().int().min(1).max(99),
        }),
      )
      .max(100)
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.channel === "pos" && value.expectedTotalCents === undefined)
      ctx.addIssue({
        code: "custom",
        path: ["expectedTotalCents"],
        message: "Confirm the displayed cash total before recording the sale.",
      });
    if (value.channel === "online" && value.address.length < 10)
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Enter a complete shipping address (at least 10 characters).",
      });
    if (value.channel === "online" && value.phone.length < 7)
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter a contact phone number.",
      });
  });
export function previewImport(csv) {
  let records;
  try {
    records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      max_record_size: 5000,
    });
  } catch {
    return {
      valid: false,
      rows: [],
      errors: [
        {
          row: 0,
          message:
            "The CSV could not be read. Check the headers, commas and quotes.",
        },
      ],
    };
  }
  if (!records.length || records.length > 500)
    return {
      valid: false,
      rows: [],
      errors: [{ row: 0, message: "Import between 1 and 500 product rows." }],
    };
  const errors = [],
    rows = [],
    seen = new Set();
  for (let i = 0; i < records.length; i++) {
    const record = records[i],
      sku = String(record.sku || "")
        .trim()
        .toUpperCase();
    const price = String(record.price || "");
    const parsed = productSchema.safeParse({
      sku,
      name: record.name,
      description: record.description || "",
      category_id: record.category,
      price_cents: /^\d+(\.\d{1,2})?$/.test(price)
        ? Math.round(Number(price) * 100)
        : NaN,
      stock: /^\d+$/.test(record.stock || "") ? Number(record.stock) : NaN,
      reorder_level: record.reorder_level ? Number(record.reorder_level) : 10,
    });
    if (seen.has(sku))
      errors.push({ row: i + 2, message: `Duplicate SKU: ${sku}.` });
    seen.add(sku);
    if (!parsed.success)
      errors.push({
        row: i + 2,
        message: parsed.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; "),
      });
    else rows.push({ ...parsed.data, category: record.category.trim() });
  }
  return { valid: errors.length === 0, rows, errors };
}
