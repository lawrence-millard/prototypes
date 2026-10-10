import 'server-only'
import { compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_NAME, SESSION_SECONDS } from './constants'
import { getAdminPasswordHash, getAdminUsername, getSessionSecret } from './env'
import { constantStringEqual, signSession, verifySessionToken } from './session'

const DUMMY_BCRYPT_HASH = '$2b$12$5CMdoRX.phc0iZmRMTF/S.gD4slNMrPQmwqB3/ZsY4d6xKnil5rmG'

export async function readSession(): Promise<boolean> {
  const jar = await cookies()
  return verifySessionToken(jar.get(COOKIE_NAME)?.value, safeSecret(), safeUsername())
}

export async function requireSession(): Promise<void> {
  if (!(await readSession())) redirect('/login')
}

export async function passwordsMatch(username: string, password: string): Promise<boolean> {
  const userOk = await constantStringEqual(username, getAdminUsername())
  const hash = userOk ? getAdminPasswordHash() : DUMMY_BCRYPT_HASH
  const passwordOk = await compare(password, hash)
  return userOk && passwordOk
}

export async function issueSession(): Promise<void> {
  const token = await signSession(getAdminUsername(), getSessionSecret())
  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS,
  })
}

export async function clearSession(): Promise<void> {
  const jar = await cookies()
  jar.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}

export async function dummyPasswordWork(password: string): Promise<void> {
  await compare(password, DUMMY_BCRYPT_HASH)
}

function safeSecret(): string | undefined {
  const secret = process.env.SESSION_SECRET
  return secret && secret.length >= 32 ? secret : undefined
}

function safeUsername(): string | undefined {
  return process.env.ADMIN_USERNAME || undefined
}
