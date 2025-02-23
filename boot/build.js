// build a system in a file

async function init() {
    let html = await system.fetchURL("./index.html")
    let ldr = system.files.get("/boot/loader.js")

    ldr = ldr.replaceAll('system.baseURI = "."', 'system.baseURI = "https://raw.githubusercontent.com/ThatBeaverDev/Constellinux/refs/heads/main"')

    html = html.replaceAll('<script src="./boot/loader.js"></script><!--bootloader-->', '<script>' + ldr + '</script><!--modified origin bootloader! :D-->')

    system.files.writeFile(system.toDir("sys.html"), html)

    console.log("Build completed and placed at in " + system.toDir("sys.html"))
}