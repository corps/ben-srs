import {loadDropboxSession} from "../services/dropbox";
import {runPromise, useAsync} from "../cancellable";

const startLogin = loadDropboxSession('tlu6ta8q9mu0w01');

export function useLogin(storage: Storage) {
    return useAsync(function* () {
        return yield* runPromise(startLogin(storage));
    });
}