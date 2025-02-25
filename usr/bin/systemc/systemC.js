// systemC

function init() {
    console.log("SystemC Found and Running.")
    system.systemC = true
    system.constellinux.systemC = "v1"
    var config = system.files.get("/etc/systemc.json")
    if (config === undefined) {
        console.log("no systemC config file found. creating one.")
        let obj = {}
        obj.creation = Date.now()
        obj.services = []
        obj.services.push("/usr/bin/crl/crl.js")
        obj.services.push("/usr/bin/desktopEnv/desktopEnv.js")
        obj.services.push("/usr/bin/welcome/welcome.js")
        system.files.writeFile("/etc/systemc.json",JSON.stringify(obj))
        console.log("Created blank systemC config file at /etc/systemc.json")
    }
    let services = JSON.parse(system.files.get("/etc/systemc.json")).services
    for (const i in services) {
        system.startProcess(services[i])
    }

    //system.gui.newWindow(PID)
    //system.gui.windowInnerText(PID, "<p>hello from systemC!</p>")
}

function frame() {
}