


export async function write(fs, filepath, contents, options = {}) {
    try {
        console.log("Original Write: ", filepath, contents);
        await fs.writeFile(filepath, contents, options);
        return;
    } catch (err) {
        console.log("Original Write Failed: ", err);
        return;
        // Hmm. Let's try mkdirp and try again.
        await fs.mkdir(dirname(filepath));
        await fs.writeFile(filepath, contents, options);
    }
}

export function dirname(path) {
    const last = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    if (last === -1) return '.';
    if (last === 0) return '/';
    return path.slice(0, last);
}

export async function mkdir(fs, filepath, _selfCall = false) {
    console.log("Native mkdir: ", filepath, _selfCall);
    try {
        await fs.mkdir(filepath);
        return;
    } catch (err) {
        console.log("Native mkdir failed: ", filepath, _selfCall, err);
        // If err is null then operation succeeded!
        if (err === null) return;
        // If the directory already exists, that's OK!
        if (err.code === 'EEXIST') return;
        // Avoid infinite loops of failure
        if (_selfCall) throw err;
        // If we got a "no such file or directory error" backup and try again.
        if (err.code === 'ENOENT') {
            const parent = dirname(filepath);
            // Check to see if we've gone too far
            if (parent === '.' || parent === '/' || parent === filepath) throw err;
            // Infinite recursion, what could go wrong?
            await mkdir(fs, parent);
            await mkdir(fs, filepath, true);
        }
    }
}

export async function init2({
    fs,
    gitdir,
    defaultBranch = 'master',
}) {
    const bare = false;
    console.log("Initializing...");
    // Don't overwrite an existing config
    // if (await fs.exists(gitdir + '/config')) return;

    // let folders = [
    //     'hooks',
    //     // 'info',
    //     // 'objects/info',
    //     // 'objects/pack',
    //     // 'refs/heads',
    //     // 'refs/tags',
    // ];
    await fs.mkdir(gitdir);
    // await mkdir(fs, gitdir);
    // folders = folders.map(dir => gitdir + '/' + dir);
    // for (const folder of folders) {
    //     await mkdir(fs, folder);
    //     console.log("Created: ", folder);
    // }

    await write(
        fs,
        gitdir + '/config',
        '[core]\n' +
        '\trepositoryformatversion = 0\n' +
        '\tfilemode = false\n' +
        `\tbare = ${bare}\n` +
        (bare ? '' : '\tlogallrefupdates = true\n') +
        '\tsymlinks = false\n' +
        '\tignorecase = true\n'
    );
    // console.log("Written: ", gitdir + "/config");
    // await write(fs, gitdir + '/HEAD', `ref: refs/heads/${defaultBranch}\n`);
    // console.log("Written: ", gitdir + "/HEAD");
}
