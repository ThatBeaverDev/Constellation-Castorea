// export files to host

async function init(args) {
    const dir = system.toDir(args[0])
    const data = system.files.get(dir)

    const reversed = dir.split("").reverse().join("")
    const reversedName = reversed.substring(reversed.indexOf("/"), 0)
    const name = reversedName.split("").reverse().join("")

    const handle = await window.showSaveFilePicker({
		startIn: 'downloads',
		suggestedName: name,
	})

    // create a FileSystemWritableFileStream to write to
    const writableStream = await handle.createWritable();

    // write our file
    await writableStream.write(data);

    // close the file and write the contents to disk.
    await writableStream.close();
}