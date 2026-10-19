export function safeExternalUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function publicAssetUrl(value) {
  if (typeof value !== 'string' || !value || value.includes('\\')) return null;
  try {
    const base = new URL(import.meta.env.BASE_URL, window.location.origin);
    const url = new URL(value, base);
    if (
      url.origin !== base.origin ||
      !url.pathname.startsWith(base.pathname) ||
      url.search ||
      url.hash
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

export function safeContactUrl(value) {
  const external=safeExternalUrl(value);if(external)return external;
  if(typeof value!=='string'||value.length>320||/%0[ad]/i.test(value))return null;
  return /^mailto:[a-z\d.!#$%&'*+/=?^_`{|}~-]+@[a-z\d.-]+\.[a-z]{2,}$/i.test(value)?value:null;
}
