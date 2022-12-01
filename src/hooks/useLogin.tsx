import {loadDropboxSession} from "../services/dropbox";
import {runPromise, useAsync} from "../cancellable";

const startLogin = loadDropboxSession();

export function useLogin(storage: Storage) {
    return useAsync(function* () {
        return yield* runPromise(startLogin(storage));
    });
}