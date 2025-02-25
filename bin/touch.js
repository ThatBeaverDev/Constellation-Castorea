// write blank to a file

function init(args) {
    system.files.writeFile(system.toDir(args[0]), "")
}