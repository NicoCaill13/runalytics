import { Prisma } from '@prisma/client';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function convertPrismaDecimals<T>(data: T): T {
  // 1) Decimals -> number
  if (Prisma.Decimal.isDecimal(data as any)) {
    return (data as unknown as Prisma.Decimal).toNumber() as unknown as T;
  }

  // 2) Garder intact les instances (Date, Buffer, Map, Set, class instances…)
  if (
    data instanceof Date ||
    (typeof Buffer !== 'undefined' && data instanceof Buffer) ||
    data instanceof Uint8Array ||
    data instanceof Map ||
    data instanceof Set
  ) {
    return data;
  }

  // 3) Tableaux -> map récursif
  if (Array.isArray(data)) {
    return data.map((x) => convertPrismaDecimals(x)) as unknown as T;
  }

  // 4) Uniquement pour les plain objects, on convertit clé par clé
  if (isPlainObject(data)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      out[k] = convertPrismaDecimals(v);
    }
    return out as T;
  }

  // 5) Primitifs, undefined, etc.
  return data;
}
