// Create Directories

function init(args) {
    if (args[0][0] == "/") {
        system.folders.writeFolder(args[0])
    } else {
        let dir = system.dir
        if (dir[dir.length - 1] !== "/") {
            dir += "/"
        }
        system.folders.writeFolder(dir + args[0])
    }
}