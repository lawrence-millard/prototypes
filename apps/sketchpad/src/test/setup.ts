import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach } from 'vitest'
import { resetDbConnectionForTests } from '../db/database'

beforeEach(async () => {
  await resetDbConnectionForTests()
  globalThis.indexedDB = new IDBFactory()
})
