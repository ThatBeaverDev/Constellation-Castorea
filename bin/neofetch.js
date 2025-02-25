// display system info

async function init() {
    function convertMiliseconds(miliseconds, format) {
        var days, hours, minutes, seconds, total_hours, total_minutes, total_seconds;
        
        total_seconds = parseInt(Math.floor(miliseconds / 1000));
        total_minutes = parseInt(Math.floor(total_seconds / 60));
        total_hours = parseInt(Math.floor(total_minutes / 60));
        days = parseInt(Math.floor(total_hours / 24));
      
        seconds = parseInt(total_seconds % 60);
        minutes = parseInt(total_minutes % 60);
        hours = parseInt(total_hours % 24);
        
        switch(format) {
          case 's':
              return total_seconds;
          case 'm':
              return total_minutes;
          case 'h':
              return total_hours;
          case 'd':
              return days;
          default:
              return { d: days, h: hours, m: minutes, s: seconds };
        }
    }
    let icon = await system.fetchURL("./logoAscii.txt")
    icon = icon.split("\n")
    for (const i in icon) {
        let key = ""
        let val = ""
        let toAdd = ""
        try {
            switch(String(i)) {
                case "1":
                    toAdd = "<green>Constellinux</green>"
                    break;
                case "2":
                    toAdd = "-------------------"
                    break;
                case "4":
                    key = 'Host OS'
                    val = navigator.userAgentData.platform
                    break;
                case "5":
                    key = "Kernel"
                    val = system.constellinux.constellinux
                    break;
                case "6":
                    let time = convertMiliseconds(Date.now() - system.startTime)
                    key = "Uptime"
                    val = time.d + " Days, " + time.h + " Hours, " + time.m + " Minutes."
                    break;
                case "9":
                    key = "Resolution"
                    val = window.innerWidth + "x" + window.innerHeight
                    break;
                case "10":
                    key = "DE"
                    val = system.constellinux.desktop
                    break;
                case "12":
                    key = "Terminal"
                    val = system.constellinux.terminal
                    break;
                case "14":
                    key = "CPU Cores"
                    val = navigator.hardwareConcurrency
                    break;
                case "16":
                    key = "JS Heap (Memory)"
                    val =  Math.round(performance.memory.totalJSHeapSize / 8388608) + "MiB / " + Math.round(performance.memory.jsHeapSizeLimit / 8388608) + "MiB"
            }
        } catch(e) {}
        if (toAdd == "") {
            if (key !== "") {
                icon[i] = icon[i] + "<yellow>" + key + ": " + "</yellow>" + val
            }
        } else {
            icon[i] = icon[i] + toAdd
        }
    }
    icon = icon.join("\n")
    console.log(icon)
}