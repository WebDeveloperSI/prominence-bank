export const fmtMoney = (n: number, ccy = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, minimumFractionDigits: 2 }).format(n);

export const fmtNum = (n: number, d = 2) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

export const maskAcct = (a: string) => a.replace(/.(?=.{4})/g, "•");

export const cents = (n: number) => Math.round(n * 100);
export const fromCents = (n: number | bigint | null | undefined) =>
  Number(n ?? 0) / 100;
export const fmtCents = (n: number | bigint | null | undefined, ccy = "USD") =>
  fmtMoney(fromCents(n), ccy);
export const maskEmail = (e: string) => {
  const [u, d] = e.split("@");
  if (!u || !d) return e;
  return `${u.slice(0, 2)}${"•".repeat(Math.max(2, u.length - 2))}@${d}`;
};
