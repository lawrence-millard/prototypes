import { createContext, useContext, type ReactNode } from 'react'
import { LOCAL_OWNER_ID } from './config'

export type SessionMode = 'local' | 'clerk'

export interface Session {
  ownerId: string
  mode: SessionMode
}

const SessionContext = createContext<Session>({ ownerId: LOCAL_OWNER_ID, mode: 'local' })

export function OwnerProvider({
  ownerId,
  mode,
  children,
}: {
  ownerId: string
  mode: SessionMode
  children: ReactNode
}) {
  return <SessionContext.Provider value={{ ownerId, mode }}>{children}</SessionContext.Provider>
}

export function useSession(): Session {
  return useContext(SessionContext)
}
