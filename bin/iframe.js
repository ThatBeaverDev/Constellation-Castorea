// opens iFrame of a website.

function init(args) {
    if (args[0].substring(0,4) !== "http") {
        args[0] = "https://" + args[0]
    }
    let iframe = '<iframe style="width: 100%; height: 100%;", src="' + args[0] + '"></iframe>'
    system.gui.newWindow(PID)
    system.gui.windowInnerHTML(PID,iframe)
}

function frame(args) {}