
// import { configureSingle, fs as zenfs } from '@zenfs/core';
// import { IndexedDB } from '@zenfs/dom';
import http from "isomorphic-git/http/web";
import git from "isomorphic-git";
import { Buffer as buf } from "buffer";
import _ from "lodash";
import LightningFS from "@isomorphic-git/lightning-fs";
import { $fetch } from "@/services/api";

var Buffer = buf;
window.Buffer = Buffer;

let fs = new LightningFS();

export async function cloneRepoBrowser(url: string) {

    // const dir = await window.navigator.storage.getDirectory();
    // await configureSingle({ backend: IndexedDB });

    // try {
    //     await zenfs.promises.rm('/testrepo', { recursive: true });
    // }
    // catch (err) {
    //     console.log("Error when deleting: ", err);
    // }

    // await zenfs.promises.mkdir('/testrepo');

    await git.clone({
        fs: fs,
        http,
        dir: "/testrepo/",
        // corsProxy: 'https://cors.isomorphic-git.org',
        url: url,
        singleBranch: true,
        onAuth: async () => ({ username: 'ehassaan', password: 'github' }),
        depth: 1
    });
    // console.log(await zenfs.promises.lstat("/testrepo/.git/config"));

}


export async function cloneRepo(url: string) {

    const res = await $fetch("/api/git", {
        method: "POST",
        body: {
            git_https_url: url
        }
    });
    if (res.error) throw Error("Failed to clone: " + res.error.message);
    else return (res.data as any).data.chunks;
}

export async function readLocal() {
    const directory = await (window as any).showDirectoryPicker({
        id: 'duck-annotate',
        mode: 'read',
        startIn: 'documents'
    }) as FileSystemDirectoryHandle;
    return directory;
}

// export let cloneRepo = fakeClone;
