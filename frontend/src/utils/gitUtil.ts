
import { configureSingle, fs } from '@zenfs/core';
import { WebAccess } from '@zenfs/dom';
import http from "isomorphic-git/http/web";
import git from "isomorphic-git";
import { Buffer as buf } from "buffer";
// import LightningFS from "@isomorphic-git/lightning-fs";

var Buffer = buf;
window.Buffer = Buffer;
console.log(Buffer);

async function cloneRepo1() {

    const dir = await window.navigator.storage.getDirectory();
    await configureSingle({ backend: WebAccess, handle: dir });

    // try {
    //     await fs.promises.mkdir('/myrepo3/');
    // }
    // catch (err) {
    //     console.warn("Failed to create dir: ", err);
    // }

    // window.fs = fs;

    // if (!fs.existsSync('/test.txt')) {
    //     fs.writeFileSync('/test.txt', 'This will persist across reloads!');
    // }

    await git.clone({
        fs: fs,
        http,
        dir: "/myrepo5/",
        corsProxy: 'https://cors.isomorphic-git.org',
        url: 'https://github.com/ehassaan/duck-annotate',
        ref: 'main',
        singleBranch: true,
        depth: 1
    });

    console.log(await fs.promises.lstat("/myrepo5/"));

    // const contents = window.FileSystem..readFileSync('/test.txt', 'utf-8');
    // console.log(contents);

    // const res = await git.clone({ fs, http: gitHttp, dir, url: 'https://github.com/isomorphic-git/lightning-fs' });
}

async function fakeClone() {
    const directory = await window.showDirectoryPicker({
        id: 'duck-annotate',
        mode: 'read',
        startIn: 'documents'
    }) as FileSystemDirectoryHandle;
    return directory;
}

export let cloneRepo = fakeClone;
