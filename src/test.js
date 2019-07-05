async function* how_many_patern_match(pattern = null) {
    const target = await stat(this.target);
    if (!target.isDirectory()) {
        throw new Error("target must be a path to a directory");
    }
    else if (pattern !== null && Object.prototype.toString.call(pattern).slice(8, -1) !== "RegExp") {
        throw new TypeError("pattern must be a RegExp or a null value");
    }
    const repo = await readdir(this.target);
    let counter = 0;
    for await (const file of repo) {
        const repo = await stat(join(this.target, file));
        if (repo.isDirectory()) {
            yield* recSize(join(location, files[id]));
        }
        const readedFile = await readFile(join(this.target, file));
        if (pattern.test(readedFile.toString())) {
            counter += 1;
        }
    }

    return counter;
}