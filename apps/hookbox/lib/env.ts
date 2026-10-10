import 'server-only'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export function getDatabaseUrl(): string {
  return required('DATABASE_URL')
}

export function getSessionSecret(): string {
  const secret = required('SESSION_SECRET')
  if (secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters')
  return secret
}

export function getAdminUsername(): string {
  return required('ADMIN_USERNAME')
}

export function getAdminPasswordHash(): string {
  const hash = required('ADMIN_PASSWORD_HASH')
  if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash)) {
    throw new Error('ADMIN_PASSWORD_HASH must be a bcrypt hash')
  }
  return hash
}
