const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomHexDigit(): string {
  return Math.floor(Math.random() * 16).toString(16);
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char: string) => {
    const random = Number.parseInt(randomHexDigit(), 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function isValidUUID(value: unknown): boolean {
  return UUID_V4_REGEX.test(String(value || '').trim());
}
