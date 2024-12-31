
// import { configureSingle, fs } from '@zenfs/core';
// import { WebAccess } from '@zenfs/dom';
import http from "isomorphic-git/http/web";
import git from "isomorphic-git";
import LightningFS from "@isomorphic-git/lightning-fs";

window.fs = new LightningFS('fs')
window.pfs = window.fs.promises

export async function cloneRepo() {

    // const dir = await window.navigator.storage.getDirectory();
    // await configureSingle({ backend: WebAccess, handle: dir });

    // try {
    //     fs.mkdirSync('/myrepo/');
    // }
    // catch (err) {
    //     console.warn("Failed to create repo: ", err);
    // }

    // window.fs = fs;

    // if (!fs.existsSync('/test.txt')) {
    //     fs.writeFileSync('/test.txt', 'This will persist across reloads!');
    // }

    await git.clone({
        fs: window.fs,
        http,
        dir: "/myrepo/",
        corsProxy: 'https://cors.isomorphic-git.org',
        url: 'https://github.com/diegomura/react-pdf.git',
        ref: 'main',
        singleBranch: true,
        depth: 1
    });

    // const contents = window.FileSystem..readFileSync('/test.txt', 'utf-8');
    // console.log(contents);

    // const res = await git.clone({ fs, http: gitHttp, dir, url: 'https://github.com/isomorphic-git/lightning-fs' });
}
