import { loadDropboxSession } from '../services/dropbox';
import { runPromise } from '../cancellable';
import { useAsync } from './useWithContext';

const startLogin = loadDropboxSession();

export function useLogin(storage: Storage) {
  return useAsync(function* () {
    return yield* runPromise(startLogin(storage));
  });
}
