// shared/lib/createBranded.ts

// Универсальная фабрика для брендированных типов
export function createBranded<T, BrandedType>(value: T): BrandedType {
  return value as unknown as BrandedType;
}
