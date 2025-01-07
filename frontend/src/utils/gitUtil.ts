
import { configureSingle, fs as zenfs } from '@zenfs/core';
import { IndexedDB } from '@zenfs/dom';
import http from "isomorphic-git/http/web";
import git from "isomorphic-git";
import { Buffer as buf } from "buffer";
import _ from "lodash";
// import LightningFS from "@isomorphic-git/lightning-fs";

var Buffer = buf;
window.Buffer = Buffer;
// console.log(Buffer);


export async function cloneRepo() {

    // const dir = await window.navigator.storage.getDirectory();
    await configureSingle({ backend: IndexedDB });

    try {
        await zenfs.promises.rm('/testrepo', { recursive: true });
    }
    catch (err) {
        console.log("Error when deleting: ", err);
    }

    await zenfs.promises.mkdir('/testrepo');

    await git.clone({
        fs: zenfs,
        http,
        dir: "/testrepo/",
        // corsProxy: 'https://cors.isomorphic-git.org',
        url: 'https://github.com/ehassaan/duck-annotate',
        ref: 'main',
        singleBranch: true,
        depth: 1
    });

    console.log(await zenfs.promises.lstat("/testrepo/.git/config"));

}

export async function cloneRepo1() {
    const directory = await window.showDirectoryPicker({
        id: 'duck-annotate',
        mode: 'read',
        startIn: 'documents'
    }) as FileSystemDirectoryHandle;
    return directory;
}

// export let cloneRepo = fakeClone;
