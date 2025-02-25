// Reports Constellinux Data.

function init(args) {
    if (args[0] == undefined) {
        let keys = Object.keys(system.constellinux)
        let response = ""
        for (const i in keys) {
            response += "\n" + keys[i] + ": " + system.constellinux[keys[i]]
        }
        console.log(response)
    } else {
        console.log(system.constellinux[args[0]])
    }
}