// Aurora Package Manager for Constellinux Shell

async function init(arguements) {
    system.isInstalling = true
    system.constellinux.aurora = "apmv0.1.1"
    //csw.versions.registerApp("apmv0.1.1")
    if (!system.aurora.init) {
        system.aurora = {...system.aurora, ...{version: 0.01, directory: "/usr/bin/aurora", init: true, index: JSON.parse(system.files.get(system.aurora.directory + "/index.json") || "{}") } }
    }
    const aurora = system.aurora
    const index = system.aurora.index

    const args = []
    const flags = []
    
    // check for flag parameters, and make sure they are in a seperate array
    for (const i in arguements) {
        if (arguements[i][0] == "-") {
            flags.push(arguements[i])
        } else {
            args.push(arguements[i])
        }
    }

    let data
    let file
    let id1
    let id2

    const isSilent = flags.includes("-s")

    switch(args[0]) {
        case "install":

            if (typeof args[1] == "object") {
                for (const i in args[1]) {
                    const package = args[1][i]
                    await init(["install", package])
                }
                return
            }


            if (!isSilent) {
                id1 = console.post("install of " + args[1] + " 0% completed")
                id2 = console.post("--------------------")
            }
            
            // download the package info
            data = await system.fetchURL(aurora.url + "/pkgs/" + args[1] + "/info.json")

            if (!isSilent) {
                console.edit("install of " + args[1] + " 50% completed", id1)
                console.edit("##########----------", id2)
            }

            // parse it, and if it's invalid, catch and tell the user the package either doesn't exist OR is formatted wrong
            try {
                data = JSON.parse(data)
            } catch(e) {
                if (e == 'SyntaxError: "undefined" is not valid JSON') {
                    console.edit("Installation of " + args[1] + " has failed because the package does not exist.", id1, "error")
                    console.edit("", id2, "error")
                } else {
                    console.edit("Installation of " + args[1] + " has failed because the package info is invalid: " + e, id1, "error")
                    console.edit("", id2, "error")
                }
                break;
            }

            // install dependencies
            for (const i in data.dependencies) {
                system.startProcess("/bin/aurora.js", ["install", data.dependencies[i]], true)
            }

            // download other files the package needs
            const files = Object.keys(data.files || {})
            for (const i in files) {
                const file = files[i]
                const uri = aurora.url + "/pkgs/" + args[1] + file

                // download
                const content = await system.fetchURL(uri)
                const dir = data.files[file]
                system.files.writeFile(dir, content)
            }

            index[args[1]] = true

            for (const i in data.directories) {
                system.folders.writeFolder(data.directories)
            }

            if (data.lang == undefined) {
                data.lang = ""
            } else {
                data.lang = "." + data.lang
            }

            // download the file
            file = await system.fetchURL(aurora.url + "/pkgs/" + args[1] + "/src" + data.lang)
            
            if (data.directory !== undefined) {
                // write the file to it's specific directory
                // I intend to require elevated permissions for this in future
                system.files.writeFile(data.directory + "/" + args[1] + data.lang, file)
            } else {    
                // write the file
                system.files.writeFile(aurora.directory + "/" + args[1] + data.lang, file)
            }

            if (!isSilent) {
                console.edit("install of " + args[1] + " 100% completed", id1)
                console.edit("####################", id2)
            }
            break;
    }

    system.files.writeFile(aurora.directory + "/index.json", JSON.stringify(index))
    system.isInstalling = false
}