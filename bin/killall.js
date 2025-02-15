// kill all processes with a set directory

function init(args) {
    if (args[0] == undefined) {
        console.post("usage: killall [processDirectory]\nYou must specify the process directory to kill.")
    }

    let toKill = []

    // math the processes
    for (const i in system.processes) {
        if (system.processes[i].name == args[0]) {
            toKill.push(i)
        }
    }

    // kill the processes
    for (const i in toKill) {
        system.stopProcess(i)
    }
}