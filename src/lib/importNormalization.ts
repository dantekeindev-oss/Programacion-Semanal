const KONECTA_DOMAIN_FALLBACK = 'konecta.com';

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function toTitleCase(value: string) {
  return value
    .toLocaleLowerCase('es-AR')
    .replace(/\b\p{L}/gu, (char) => char.toLocaleUpperCase('es-AR'));
}

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeDisplayText(value: string) {
  const cleanValue = normalizeWhitespace(value);

  if (!cleanValue) {
    return '';
  }

  return cleanValue === cleanValue.toUpperCase() ? toTitleCase(cleanValue) : cleanValue;
}

export function normalizeEmail(email: string) {
  return normalizeWhitespace(email).toLowerCase();
}

export function getCorporateDomain() {
  return process.env.CORPORATE_DOMAIN || KONECTA_DOMAIN_FALLBACK;
}

export function slugifyEmailPart(value: string) {
  return stripAccents(normalizeWhitespace(value).toLowerCase())
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.');
}

export function buildAgentEmail(firstName: string, lastName: string, dni: string) {
  const localPart = slugifyEmailPart(`${firstName}.${lastName}`) || `usuario.${dni}`;
  return `${localPart}@${getCorporateDomain()}`;
}

export function buildLeaderEmail(name: string) {
  const localPart = slugifyEmailPart(name) || 'lider';
  return `lider_${localPart}@${getCorporateDomain()}`;
}
