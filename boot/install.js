async function install() {
    const Name = "/boot/install.js"

    system.post(Name,"Installing Packages...")
    let i = await system.fetchURL(system.baseURI + "/index.json")
    const index = JSON.parse(i).packages

    for (const i in index) {
        system.startProcess("/bin/aurora.js", ["install",index[i]], true)
    }

    system.installed = true

    system.post(Name, "Installation Complete")
}

install()