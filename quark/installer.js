    async function install() {

    const guid = await system.fsBackend.mkvol("Constellation Disk", "bootable", "localcfs", {
        quarkCfg: "/System/bootloader/quark.json"
    })

    const auroraLocation = new URL("/Constellation-Castorea-Aurora/pkgs/aurora/src.js", window.location.href)
    const cfsDriverLocation = new URL("./System/drivers/fs/localcfs.js", window.location.href)

    console.debug("Installing Constellation[Aurora] from " + auroraLocation)
    const aurora = await (await fetch(auroraLocation)).text()

    console.debug("Obtaining cfsDriver from " + cfsDriverLocation)
    const cfsDriverSrc = await (await fetch(cfsDriverLocation)).text()
    const cfsDriverFnc = new Function("system", cfsDriverSrc)

    system.drivers = {
        fs: {
            localcfs: await cfsDriverFnc(system)
        }
    }
    const d = system.drivers.fs.localcfs

    const fs = await d.newFS(guid)

    async function fetchURL(URL, parse = false) {
        const data = await fetch(URL)
        
        if (parse) {
            return await data.json()
        } else {
            return await data.text()
        }
        
    }

    console.log("Creating Basic Directories...")

    system.baseURI = ".";

    let list = await fetchURL(system.baseURI + "/index.json", true)

    console.warn(list)
    folders = list.folders
    for (const item in folders) {
        await d.writeFolder(folders[item], "root", fs, guid)
    }

    console.log("Writing Default Files...")

    files = list.files
    for (const item in files) {
        if (typeof files[item] == "object") {
            // handle files with other requirements for being written to FS
            obj = await fetchURL(system.baseURI + files[item].dir)

            if (files[item].parse) {
                obj = JSON.parse(obj)
            }

            console.debug(obj)

            await d.writeFile(files[item].dir, obj, "root", fs, guid)
        } else {
            obj = await fetchURL(system.baseURI + files[item])
            await d.writeFile(files[item], obj, "root", fs, guid)
        }
    }

    let auroraFiles = list.auroraFiles
    for (const loc in auroraFiles) {
        const targetDir = auroraFiles[loc]
        const uri = new URL("/Constellation-Castorea-Aurora" + loc, window.location.href)

        const item = await fetchURL(uri)

        await d.writeFile(targetDir, item, "root", fs, guid)

    }

    await d.writeFile("/System/apps/utils/aurora.js", aurora, "root", fs, guid)

    await d.writeFile("/sysState.json", {
        isNew: true
    }, "root", fs, guid)
    
    await d.onUpdate(guid, fs)


    system.reboot()
}

return install