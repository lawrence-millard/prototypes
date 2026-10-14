function bytesToB64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function b64ToBytes(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function bytesToB64url(bytes: Uint8Array) {
  return bytesToB64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export function b64urlToBytes(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4)
  return b64ToBytes(padded)
}

export async function encryptSecret(plaintext: string) {
  if (plaintext.length < 1 || plaintext.length > 4000) throw new Error('invalid')
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)))
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  return { ciphertext: bytesToB64(ciphertext), iv: bytesToB64(iv), key: bytesToB64url(raw) }
}

export async function decryptSecret(ciphertext: string, iv: string, key: string) {
  const raw = b64urlToBytes(key)
  const imported = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt'])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(iv) }, imported, b64ToBytes(ciphertext))
  return new TextDecoder().decode(plain)
}
