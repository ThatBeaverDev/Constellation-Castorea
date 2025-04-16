// wrapper for system calls

//const system = window[window["12hider for system"]]
//const processes = system.fs.readFile("/proc")
const processes = system.processes

system.csw = {}
system.csw.tokens = {}

class token {
    constructor(PID, user) {
        this.PID = PID
        this.user = user
    }

    checkPermission(permission) {
        return this.permissions[permission]
    }
}

csw = {}

// files functions
csw.fs = {}
// files
csw.fs.read = function (tokenID, directory, attribute) {
    if (directory == undefined) {
        throw new Error("directory must be defined!")
    }
    if (directory == "/proc") {
        return system.processes
    }

    const token = tokeninf(tokenID)

    return system.fs.readFile(directory, attribute, token.user)
}
csw.fs.write = function (tokenID, directory, contents) {
    if (directory == undefined || contents == undefined) {
        throw new Error("directory AND contents must be defined!")
    }

    const token = tokeninf(tokenID)

    return system.fs.writeFile(directory, contents, token.user)
}
csw.fs.delete = function (tokenID, directory) {
    if (directory == undefined) {
        throw new Error("directory must be defined!")
    }

    const token = tokeninf(tokenID)

    return system.fs.deleteFile(directory, token.user)
}

// folders
csw.fs.createDir = function (token, directory) {
    if (directory == undefined) {
        throw new Error("directory must be defined!")
    }

    return system.fs.writeFolder(directory)
}
csw.fs.deleteDir = function (token, directory, recursive, verbose) {
    if (directory == undefined) {
        throw new Error("directory must be defined!")
    }

    return system.fs.deleteFolder(directory, recursive, verbose)
}
csw.fs.listDir = function (token, directory) {
    if (directory == undefined) {
        throw new Error("directory must be defined!")
    }

    return system.fs.listFolder(directory)
}

csw.fs.isDirectory = function (token, directory) {
    if (directory == undefined) {
        throw new Error("directory must be defined!")
    }

    return system.fs.isFolder(directory)
}

csw.fs.toDirectory = function (token, directory, baseDir) {
    return system.toDir(directory, baseDir)
}

csw.fs.createVFS = function (token, directory, keyname = "fs") {
    if (directory == undefined) {
        throw new Error("directory must be defined!")
    }

    const tkn = tokeninf(token);

    return system.newVFS(tkn.PID, directory, keyname)
}

//     mount system.cfsv2 /mnt/system

// get modules to import
csw.lib = function (token, name, dir = "/lib") {
    function textToDataURI(data, type = "plain/text") {
        const str = String(data)
        const b64 = btoa(unescape(encodeURIComponent(str)))
        const uri = `data:${type};base64,` + b64
        return uri
    }

    const module = csw.fs.read(token, dir + "/" + name)
    const moduleURI = textToDataURI(module, "text/javascript")

    return moduleURI
}

// process management
csw.processes = {}
csw.processes.execute = function (token, directory, args, isUnsafe) {
    // please make sure only admin processes can start unsafe processes!
    return system.startProcess(directory, args, isUnsafe)
}
csw.processes.terminate = function (token, PID) {
    return system.stopProcess(PID)
}


// terminal CLI features
csw.display = {}
csw.display.fullscreenApp = ""
// terminal fullscreening support
csw.display.fullscreen = function (token, PID) {
    csw.display.fullscreenApp = PID
    system.focus.push(PID)
}
csw.display.set = function (token, PID, data) {
    processes[PID].display = data

    if (PID == system.fcs) {
        system.refreshDisplay()
    }
}
csw.display.visible = function (token, PID) {
    switch (typeof system.fcs) {
        case "string":
        case "number":
            return Number(system.fcs) == Number(PID)
        case "object":
            return system.fcs.includes(PID)
        default:
            throw new Error(`Unknown type of system.fcs: ${typeof system.fcs}`)
    }
}
csw.display.registerAsDesktop = function (token, PID) {
    system.displayManager = PID
}
csw.display.rename = function (token, PID, name) {
    processes[PID].guiName = name
}

// versions system
csw.versions = {}
csw.versions.registerApp = function (token, Name, Version) {
    system.versions[Name] = Version
}

// networking
csw.net = {}
csw.net.fetch = async function (token, url) {
    return await system.fetchURL(url)
}

function tokeninf(token) {
    return system.csw.tokens[token]
}

// TEMPORARY ELEVATION FUNCTION
csw.permissions = {}
csw.permissions.changeUser = function (token, PID, username, password) {

    const tokenInfo = tokeninf(token)

    const user = system.fs.readFile("/etc/passwd")[username]
    if (user == undefined) {
        return {
            ok: false,
            reason: `User '${username}' does not exist!`
        }
    }

    const passwd = user.password

    const passHash = window.cryptography.sha_256(password)

    if (passwd == passHash) {
        // correct password!
        //const proc = system.fs.readFile("/proc")
        const proc = system.processes
        proc[PID].token.user = username
        return {
            ok: true
        }
    } else {
        return {
            ok: false,
            reason: `Password is incorrect for user '${username}'!`
        }
    }
}

function newTokenID() {
    let id

    while (id == undefined || system.csw.tokens[id] !== undefined) {
        id = Math.floor(Math.random() * 18446744073709551615)
    }

    return id
}

csw.permissions.newToken = function (PID, user = "root") {
    if (PID == undefined) {
        throw new Error("PID must be defined")
    }

    const id = newTokenID()

    system.csw.tokens[id] = new token(PID, user)

    return id
}

csw.permissions.elevate = function (token) {
    return system
}

// Work out what functions we have so we can replace them all to include the accessToken
const functions = []

const cswKeys = Object.keys(csw)
for (const i in cswKeys) {
    const key = csw[cswKeys[i]]

    switch (typeof key) {
        case "function":
            functions.push("csw." + cswKeys[i])
            break;
        case "object":
            const keyKeys = Object.keys(key)

            for (const j in keyKeys) {
                const item = key[keyKeys[j]]

                if (typeof item == "function") {
                    functions.push("csw." + cswKeys[i] + "." + keyKeys[j])
                }
            }
            break;
    }
}
csw.functions = functions

console.log("CSW loaded.")
system.systemWrapper = true
