// Download from web URL
// last revision: 15/2/2025, 11:17

async function init(args) {
    let data = await system.fetchURL(args[0])
    system.files.writeFile(system.toDir(args[1] || "") + args[0].textAfterAll("/"), data)
}