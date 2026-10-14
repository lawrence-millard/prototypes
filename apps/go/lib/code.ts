import { randomBytes } from "node:crypto"

const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"

export function randomCode(size = 7) {
  const bytes = randomBytes(size)
  let out = ""
  for (let i = 0; i < size; i++) out += alphabet[bytes[i]! % alphabet.length]
  return out
}

export function validCode(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 3 && value.length <= 32
}
