function init() {
    system.langBackend.crl = {}
    system.languages.crl = function (dir) {
        let code = system.extend("system.langBackend.crl",system.files.get(system.toDir(dir)))
        code = code.replaceAll("system.langBackend.crl.log(", "system.langBackend.crl.log(Name,")
        code = code.replaceAll("system.langBackend.crl.warn(", "system.langBackend.crl.warn(Name,")
        code = code.replaceAll("system.langBackend.crl.error(", "system.langBackend.crl.error(Name,")
        code = code.replaceAll("system.langBackend.crl.init", "init")
        code = code.replaceAll("system.langBackend.crl.frame", "frame")
        return code
    }

    const f = {}

    // Logging Functions
    f.log = function (owner, txt) {
        system.log(owner, txt)
    }

    f.warn = function (owner, txt) {
        system.warn(owner, txt)
    }

    f.error = function (owner, txt) {
        system.error(owner, txt)
    }

    // Encoding / Decoding Functions
    f.encode = {}
    f.decode = {}
    // URL Encode / Decode
    f.encode.url = function (value) {
        return encodeURIComponent(value).replaceAll('%20','+');
    }
    f.decode.url = function (value) {
        return decodeURIComponent(value.replaceAll('+','%20'));
    }

    // Drive Functions
    f.drive = {}
    f.drive.write = function (directory, content) {
        try {
            system.files.writeFile(directory, content)
            return true
        } catch(e) {}
        return false
    }
    f.drive.ls = function (directory) {
        return system.folders.listDirectory(directory)
    }
    f.drive.read = function (directory) {
        return system.files.get(directory)
    }

    // Web Functions
    f.url = {}
    f.url.get = async function (url) {
        return system.fetchURL(url)
    }

    // arrays
    f.array = {}
    f.array.get = function (key, array) {
        const arr = JSON.parse(JSON.stringify(array))

        for (const i in arr) {
            arr[i] = arr[i][key]
        }
        return arr
    }

    system.langBackend.crl = f
}