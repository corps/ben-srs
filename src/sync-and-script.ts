#! /usr/bin/env -S node -r "ts-node/register"
import 'regenerator-runtime';

import {Readable} from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { DropboxAuth, Dropbox } from "dropbox";
import { DropboxSyncBackend } from "./services/dropbox";
import { mapSomeAsync } from './utils/maybe';
import * as sp from 'child_process';
import { StoredBlob } from './services/storage';

const { REFRESH_TOKEN = "", APP_KEY = "", APP_SECRET ="" } = process.env;
const config = { REFRESH_TOKEN, APP_KEY, APP_SECRET };
const program = process.argv[1];

Object.entries(config).forEach(([k, v]) => {
    if (!v) {
        console.error(`${k} must be set`);
        process.exit(1);
    }
});

if (!program) {
    console.error(`usage: ${process.argv0} <bin>`);
    process.exit(1);
}

if (!fs.existsSync(program)) {
    console.error(`bin '${program}' must be a valid absolute path`);
    process.exit(1);
}

const auth = new DropboxAuth();
auth.setClientId(config.APP_KEY);
auth.setClientSecret(config.APP_SECRET);
auth.setRefreshToken(config.REFRESH_TOKEN);

// await auth.refreshAccessToken();
//
const sync = new DropboxSyncBackend(new Dropbox({auth}));


async function runIt() {
    let cursor = "";
    let i = 0;

    for(let progress of sync.syncFileList(cursor)) {
        console.log(`Processing changeset @${i}`);
        const fileList = await progress;
        i += fileList.delta.length;
        cursor = fileList.cursor;

        for (let fd of fileList.delta) {
            await mapSomeAsync(fd.updated, async fm => {
                const controller = new AbortController();
                const { signal } = controller;

                async function * downloadIt() {
                    for (let [batch, limiter] of sync.downloadFiles([fm])) {
                        for (let download of batch) {
                            const [md, blob] = await download;
                            yield blob;
                        }
                        await limiter;
                    }
                }

                const readable = Readable.from(downloadIt());

                const proc = sp.spawn(program, {
                    env: {
                        ...process.env,
                        FILE_SIZE: fm.size + "",
                        FILE_PATH: fm.path,
                        FILE_REV: fm.rev,
                        FILE_ID: fm.id,
                    },
                    signal,
                })
                
                return new Promise((resolve, reject) => {
                    proc.stdin.on('error', function(err: any) {
                      if (['ECONNRESET', 'EPIPE', 'EOF'].indexOf(err.code) >= 0) { return; }
                          reject(err);
                    });

                    proc.stdin.on('close', function() {
                        readable.pause();
                        readable.unpipe(proc.stdin);
                    });
                
                    readable.pipe(proc.stdin);

                    const remainingWork: Promise<any>[] = [];

                    proc.on('error', reject);
                    proc.on('exit', function(code, signal) {
                        if (code) {
                          reject(new Error(`${program} failed with ${code}`));
                        } else if (signal) {
                          reject(new Error(`${program} interrupted with ${signal}`));
                        } else {
                            Promise.all(remainingWork).then(resolve, reject);
                        }
                   });
                   
                   let buff = "";
                   proc.on('data', function(data) {
                        const str = buff + data.toString();
                        const parts = str.split("\n");
                        parts.forEach(fileName => {
                            const stored: StoredBlob = {
                                path: `/${path.basename(fileName)}`,
                                id: "",
                                rev: "",
                                size: 0,
                                ext: "",
                                dirty: 1,
                                updatedAt: 0,
                                blob: fs.readFileSync(fileName),
                            };
                            sync.uploadFile();
                        });
                        buff = last;
                   });
                });
            });
        }
    }
}
