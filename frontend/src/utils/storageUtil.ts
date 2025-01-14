
// import { configureSingle, fs as fSys } from '@zenfs/core';
// import { WebAccess } from '@zenfs/dom';


// export const fs = fSys.promises;
let dir: FileSystemDirectoryHandle = null;

export async function configure() {
    dir = await window.navigator.storage.getDirectory();
    // await configureSingle({ backend: WebAccess, handle: dir });
}

export async function setKey(key: string, value: string) {
    if (!dir) throw Error("Storage is not configured");


    const keyval = await dir.getDirectoryHandle('keyval', { create: true });
    const file = await keyval.getFileHandle(key, { create: true });
    const writer = await file.createWritable({ keepExistingData: false });
    await writer.write(value);
    await writer.close();
}

export async function getKey(key: string) {

    const keyval = await dir.getDirectoryHandle('keyval', { create: true });
    const file = await keyval.getFileHandle(key, { create: false });
    const text = (await file.getFile()).text();
    return text;
}
