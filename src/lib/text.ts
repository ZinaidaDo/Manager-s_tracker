export function slugifyCode(name: string) {
  const base = name
    .replace(/[^A-Za-zА-Яа-я0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  return base.slice(0, 12) || "PRJ";
}
