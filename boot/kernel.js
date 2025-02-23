async function kernel() {
	const Name = "/boot/kernel.js"
	const PID = -1

	try {
		system.constellinux.constellinux = "ckv0.1.1"
		system.constellinux.terminal = system.constellinux.constellinux

		// https://patorjk.com/software/taag/#p=display&h=0&f=Doom&t=Constellinux 
		system.post("", String(" _____                     _          _  _  _                     \n/  __ \\                   | |        | || |(_)                    \n| /  \\/  ___   _ __   ___ | |_   ___ | || | _  _ __   _   _ __  __\n| |     / _ \\ | '_ \\ / __|| __| / _ \\| || || || '_ \\ | | | |\\ \\/ /\n| \\__/\\| (_) || | | |\\__ \\| |_ |  __/| || || || | | || |_| | >  < \n \\____/ \\___/ |_| |_||___/ \\__| \\___||_||_||_||_| |_| \\__,_|/_/\\_\\"))
		system.post("", " ")

		system.temp = await system.fetchURL("https://thatbeaverdev.github.io/beaverUtils.js")
		eval(system.temp)
		delete system.temp

		system.log(Name, "Starting JS Engine...")

		system.languages = {}
		system.langBackend = {}
		system.languages.js = function(dir) {
			let code = system.files.get(dir)
			if (system.forceSystemLog) {
				code = code.replaceAll("console.log(", "system.log(Name,")
				code = code.replaceAll("console.post(", "system.post(Name,")
				code = code.replaceAll("console.warn(", "system.warn(Name,")
				code = code.replaceAll("console.error(", "system.error(Name,")
				code = code.replaceAll("console.edit(", "system.editLog(Name,")
			}
			return code
		}

		system.extend = function(pre, text) {
			let txt = String(text.replaceAll("\n", "\n ")).split("(")
			let result = ""

			for (const i in txt) {
				let item = txt[i]
				if (Number(i) !== txt.length - 1) {
					if (item[item.length - 1] !== " ") {
						let tmp = item.split(" ").reverse()
						let post = tmp.splice(0, 1)[0]
						let prea = tmp.reverse().join(" ")

						result += prea + " " + pre + "." + post + "("
					} else {
						result += item + "("
					}
				} else {
					result += item
				}
			}
			return result
		}

		system.startProcess = async function(dir, args) {
			if (system.files.get(dir) == undefined) {
				return
			}
			system.preScript = "const PID = " + system.procCount + ";"
			system.preScript += "const Name = '" + dir + "';"
			system.preScript += "const args = JSON.parse('" + JSON.stringify((args || [])) + "');"
			let obj = {}
			let code
			let type = String(dir).substring(String(dir).indexOf(".") + 1)
			code = system.languages[type](dir)
			code = system.preScript + code
			obj.code = code
			obj.args = args
			obj.variables = {}
			obj.variables.window = {}
			obj.PID = system.procCount
			obj.name = dir
			system.processes[system.procCount] = obj
			system.procCount++
			if (system.safe) {
				eval(obj.code + "\ntry {init(args) } catch(e) {  system.error(e, Name)  }")
			} else {
				eval(obj.code + "\ninit(args)")
			}
			return system.procCount - 1
		}

		system.stopProcess = function(PID) {
			system.processes.splice(Number(PID), 1)
		}

		system.toDir = function toDir(dir) {
			if (dir[0] == "/") {
				return (dir)
			} else {
				if (system.dir[system.dir.length - 1] == "/") {
					return (system.dir + dir)
				} else {
					return (system.dir + "/" + dir)
				}
			}
		}

		if (system.isNew) {
			system.log(Name, "Creating Basic Directories...")

			let list = await system.fetchURL(system.baseURI + "/index.json")

			folders = JSON.parse(list).folders
			for (const item in folders) {
				system.folders.writeFolder(folders[item])
			}

			system.log(Name, "Writing Default Files...")

			files = JSON.parse(list).files
			for (const item in files) {
				obj = await system.fetchURL(system.baseURI + files[item])
				system.files.writeFile(files[item], obj)
			}

			// fetch Aurora (package manager)
			obj = await system.fetchURL("../aurora/aurora.js")
			system.files.writeFile("/bin/aurora.js", obj)
		}

		system.log(Name, "Starting systemC...")
		system.user = "sudo"
		system.startProcess("/usr/bin/systemc/systemC.js").then()
		if (!system.systemC) {
			system.error("systemC not running.")
			return
		}

		system.input = document.getElementById('input');
		system.input.focus()
		system.preInput = document.getElementById('preInput');
		system.preInput.innerText = system.dir + " % " + system.inputText

		// INPUT
		system.keys = {}
		document.addEventListener('keydown', (e) => {
			system.keys[e.key] = true
			if (e.keyCode == 32 && e.target == document.body) {
				e.preventDefault();
			}
			let cmdKey = "Control"
			if (navigator.userAgentData.platform == "macOS") {
				cmdKey = "Meta"
			}
			if (system.keys[cmdKey]) {
				switch (e.key) {
					//case "r":
					//	e.preventDefault();
					//	break;
				}
				return
			}
			system.input.innerText = system.dir + " % " + system.inputText
		});

		document.addEventListener('keyup', (e) => {
			system.keys[e.key] = false
		})

		system.eval = async function(code, pre) {
			system.post("", pre + code)
			let segments = String(code).split(" ")
			const path = system.path
			let cmd
			for (const i in path) {
				let temp = path[i] + "/" + segments[0] + ".js"
				if (system.files.get(temp) !== undefined) {
					cmd = String(temp)
					break;
				}
			}
			if (system.files.get(cmd) == undefined) {
				//system.log(Name,"command not found:  " + segments[0])
				try {
					system.post("", eval(code))
				} catch (e) {
					system.post("", "Unknown Command: " + code + ". it is not valid JavaScript OR a valid Terminal command.")
				}
			} else {
				system.startProcess(cmd, segments.slice(1))
			}
		}

		system.path = JSON.parse(system.files.get("/etc/path.json"))
		system.log(Name, "Beginning to run processes...")
		system.post("", " ")


		var runtime = setInterval(function() {
			system.files.writeFile("/etc/path.json", JSON.stringify(system.path))
			system.input.focus()
			for (let i = 0; i < system.processes.length; i++) {
				if (system.processes[i] !== undefined) {
					if (String(system.processes[i].code).includes("frame()")) {
						if (system.safe) {
							eval(system.processes[i].code + "\ntry {frame() } catch(e) {  system.error(e, Name)  }")
						} else {
							eval(system.processes[i].code + "\nframe()")
						}
					} else {
						system.stopProcess(i)
					}
				} else {}
			}
		}, 160);

		setInterval(system.localFS.commit, 5000)
	} catch (e) {
		system.error("KERNEL PANIC - " + e.stack)
	}
}

kernel()