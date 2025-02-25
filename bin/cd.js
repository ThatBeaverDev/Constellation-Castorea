// Change Directory

function init(args) {
    if (args[0][0] == "/") {
        system.dir = args[0]
    } else {
        if (system.dir[system.dir.length - 1] !== "/") {
            system.dir += "/"
        }
        system.dir += args[0]
    }
}