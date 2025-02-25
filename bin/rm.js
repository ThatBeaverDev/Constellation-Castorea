// delete files or directories

function init(args) {
    system.files.deleteFile(system.toDir(args[0]))
}