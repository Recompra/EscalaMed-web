export function toUpper(value?: string | null) {
  return (value ?? "").toUpperCase();
}

export function formatPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  const ddd = digits.slice(0, 2);
  const p1 = digits.slice(2, 7);
  const p2 = digits.slice(7, 11);

  if (digits.length === 0) return "";
  if (digits.length < 3) return `(${ddd}`;
  if (digits.length < 8) return `(${ddd}) ${digits.slice(2)}`;
  return `(${ddd}) ${p1}-${p2}`;
}