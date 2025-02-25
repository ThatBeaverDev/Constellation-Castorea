// build a system in a file

async function init() {
    let html = await system.fetchURL("./index.html")
    const styles = await system.fetchURL("/styles.css")
    let ldr = system.files.get("/boot/loader.js")
    let kernel = system.files.get("/boot/kernel.js")

    // patch over kernel
    kernel = kernel.replaceAll('system.aurora.url = "../aurora" // aurora URL set', 'system.aurora.url = "https://raw.githubusercontent.com/ThatBeaverDev/aurora/refs/heads/main"')
    
    // patch over loader
    ldr = ldr.replaceAll('system.baseURI = "."', 'system.baseURI = "https://raw.githubusercontent.com/ThatBeaverDev/Constellinux/refs/heads/main"')
    ldr = ldr.replaceAll('const kern = await system.fetchURL(system.baseURI + "/boot/kernel.js") // kernel download', 'const kern = `' + kernel.replaceAll("\\", "\\\\") + '`')

    // patch over HTML page to include embedded styles and loader
    html = html.replaceAll('<script src="./boot/loader.js"></script><!--bootloader-->', '<script>' + ldr + '</script><!--modified origin bootloader! :D-->')
    html = html.replaceAll('<link rel="stylesheet" href="/styles.css"><!--styles-->', '<style>\n' + styles + '\n</style>')

    system.files.writeFile(system.toDir("system.html"), html)

    console.log("Build completed and placed at in " + system.toDir("system.html"))
}