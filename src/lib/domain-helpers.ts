export const PUBLIC_WEBMAILS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "yandex.com",
  "live.com",
  "msn.com",
];

export function extractEmailDomain(email: string): string {
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 ? parts[1] : "";
}

export function isPublicWebmail(domain: string): boolean {
  const clean = domain.trim().toLowerCase().replace(/^@/, "");
  return PUBLIC_WEBMAILS.includes(clean);
}

