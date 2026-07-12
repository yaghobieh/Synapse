export {
  localStorageAdapter,
  sessionStorageAdapter,
  memoryStorageAdapter,
  resolveStorageAdapter,
} from './storage';
export { attachPersistence } from './persistence';

export type {
  StorageAdapter,
  StorageKind,
  StorageInput,
  PersistMigrate,
  PersistedEnvelope,
  AttachPersistenceOptions,
  PersistHandle,
} from '../types';
