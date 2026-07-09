import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { mmkvStorage } from '@/services/storage/mmkvStorage';

export const queryPersister = createSyncStoragePersister({
  storage: mmkvStorage,
  key: 'TQ_CACHE',
  throttleTime: 1000,
});
