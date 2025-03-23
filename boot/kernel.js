async function init() {
	const Name = "/boot/kernel.js"
	const PID = -1
	
	try {
		system.logs = []
		system.refreshLogsPanel()

		system.constellinux.constellinux = "ckv0.1.2"
		system.constellinux.terminal = system.constellinux.constellinux

		// https://patorjk.com/software/taag/#p=display&h=0&f=Doom&t=Constellinux 
		system.post("", String(" _____                     _          _  _  _                     \n/  __ \\                   | |        | || |(_)                    \n| /  \\/  ___   _ __   ___ | |_   ___ | || | _  _ __   _   _ __  __\n| |     / _ \\ | '_ \\ / __|| __| / _ \\| || || || '_ \\ | | | |\\ \\/ /\n| \\__/\\| (_) || | | |\\__ \\| |_ |  __/| || || || | | || |_| | >  < \n \\____/ \\___/ |_| |_||___/ \\__| \\___||_||_||_||_| |_| \\__,_|/_/\\_\\"))
		system.post("", " ")
		document.getElementById('preInput').innerText = "Please wait..."

		system.temp = await system.fetchURL("https://thatbeaverdev.github.io/beaverUtils.js")
		eval(system.temp)
		delete system.temp

		system.log(Name, "Starting JS Engine...")

		system.languages = {}
		system.langBackend = {}
		system.languages.js = function(dir, safe) {
			let code = system.files.get(dir)
			if (system.forceSystemLog) {
				if (system.systemWrapper) {
					code = code.replaceAll("console.log(", "csw.console.log(Name,")
					code = code.replaceAll("console.post(", "csw.console.post(Name,")
					code = code.replaceAll("console.warn(", "csw.console.warn(Name,")
					code = code.replaceAll("console.error(", "csw.console.error(Name,")
					code = code.replaceAll("console.edit(", "csw.console.edit(Name,")

					for (const i in csw.functions) {
						code = code.replaceAll(csw.functions[i] + "(", csw.functions[i] + "(token,")
					}
				} else {
					code = code.replaceAll("console.log(", "system.log(Name,")
					code = code.replaceAll("console.post(", "system.post(Name,")
					code = code.replaceAll("console.warn(", "system.warn(Name,")
					code = code.replaceAll("console.error(", "system.error(Name,")
					code = code.replaceAll("console.edit(", "system.editLog(Name,")
				}
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

		system.startProcess = function(dir, args, isUnsafe) {
			try {
			if (system.files.get(dir) == undefined) {
				return
			}
			let preScript = "const PID = " + system.procCount + ";"
			preScript += "const Name = '" + dir + "';"
			preScript += "const args = JSON.parse('" + JSON.stringify((args || [])) + "');"
			preScript += "const elevated = " + !isUnsafe + ";"
			preScript += "const token = " + 0 + ";"
			preScript += "const local = lcl;"
			if (isUnsafe) {
				preScript += "const system = ssm;"
			}
			let obj = {}
			let code
			let type = "js"
			const file = system.files.get(dir)
			if (file.substring(0, 3) == "#! ") {
				const split = file.split("\n")
				const handler = split[0].substring(3)
				const handleFunc = new Function("code", "safe", "system", system.files.get(handler))
				split.shift()
				code = handleFunc(split.join("\n"), !isUnsafe, system)
			} else {
				type = String(dir).substring(String(dir).indexOf(".") + 1)
				code = system.languages[type](dir)
			}

			//if (isUnsafe === true) {} else {
			//	if ((String(code.includes("system")))) {
			//		throw new Error("Code is not allowed to directly access system: " + dir)
			//	}
			//}

			obj.PID = system.procCount
			obj.name = dir
			obj.isUnsafe = isUnsafe
			obj.args = args
			obj.variables = {}

			code = preScript + code
			obj.code = code

			system.systemWrapper = Boolean(system.systemWrapper)

			if (isUnsafe) {
				if (system.safe && system.systemWrapper) {
					// safe mode, unsafe and systemWrapper
					obj.frame = new Function("lcl", "ssm", obj.code + "\ntry {  frame(args) } catch(e) {  csw.console.error(token, Name, e)  }")
					obj.init = new Function("lcl", "ssm", obj.code + "\ntry {  init(args) } catch(e) {  csw.console.error(token, Name, e)  }")
				}
				if (system.safe && !system.systemWrapper) {
					// safe mode, unsafe, no systemWrapper
					obj.frame = new Function("lcl", "ssm", obj.code + "\ntry {  frame(args) } catch(e) {  system.error(Name, e)  }")
					obj.init = new Function("lcl", "ssm", obj.code + "\ntry {  init(args) } catch(e) {  system.error(Name, e)  }")
				}

				if (!system.safe) {
					// no safe mode, unsafe
					obj.frame = new Function("lcl", "ssm", obj.code + "\nframe(args)")
					obj.init = new Function("lcl", "ssm", obj.code + "\ninit(args)")
				}
			} else {
				if (system.safe && system.systemWrapper) {
					// safe mode, not unsafe, systemWrapper
					obj.frame = new Function("lcl", obj.code + "\ntry {  frame(args) } catch(e) {  csw.console.error(token, Name, e)  }")
					obj.init = new Function("lcl", obj.code + "\ntry {  init(args) } catch(e) {  csw.console.error(token, Name, e)  }")
				}
				if (system.safe && !system.systemWrapper) {
					// safe mode, not unsafe, no systemWrapper
					obj.frame = new Function("lcl", obj.code + "\ntry {  frame(args) } catch(e) {  system.error(Name, e)  }")
					obj.init = new Function("lcl", obj.code + "\ntry {  init(args) } catch(e) {  system.error(Name, e)  }")
				}

				if (!system.safe) {
					// no safe mode, not unsafe
					obj.frame = new Function("lcl", obj.code + "\nframe(args)")
					obj.init = new Function("lcl", obj.code + "\init(args)")
				}
			}
			
			system.processes[obj.PID] = obj
			system.procCount++

			const count = system.procCount - 1

			if (isUnsafe) {
				obj.init(system.processes[count].variables, system)
			} else {
				obj.init(system.processes[count].variables)
			}

			return count
			} catch(e) {
				console.warn(e)
				system.error(Name + ": startProcess", e)
			}
		}

		system.stopProcess = function(PID) {
			delete system.processes[Number(PID)]
		}

		system.toDir = function toDir(dir, baseDir) {
			const bDir = (baseDir || system.dir)


			if (dir[0] == "/") {
				return (dir)
			} else {
				if (bDir[bDir.length - 1] == "/") {
					return (bDir + dir)
				} else {
					return (bDir + "/" + dir)
				}
			}
		}

		system.aurora = {}
		system.aurora.url = "../aurora" // aurora URL set

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
			obj = await system.fetchURL(system.baseURI + "/boot/aurora-min.js")
			system.files.writeFile("/bin/aurora.js", obj)
		} else {
			system.folders.deleteDirectory("/var", true)
			system.folders.writeFolder("/var")
			system.folders.writeFolder("/var/crash")
			system.folders.writeFolder("/var/logs")
		}

		// initiate PATH

		system.path = JSON.parse(system.files.get("/etc/path.json"))

		system.installed = false

		if (system.isNew) {
			// run installer script
			const inst = system.files.get("/boot/install.js")
			const installation = await eval(inst)
		} else {
			system.installed = true
		}

		setInterval(function() {
			if (system.running) {
				return
			} else if (system.installed) {
				system.running = true
				lateInit()
			}
		}, 100)
	} catch (e) {
		throw new Error("Kernel Panic in init - " + e.stack)
	}
}

async function lateInit() {
	const Name = "/boot/kernel.js"
	const PID = -1


	// start user system
	system.user = "root"
	system.users = JSON.parse(system.files.get("/etc/passwd.json"))

	// function to register users
	system.users.register = function(name, obj) {

		if (system.users[name] !== undefined) {
			throw new Error("user named " + name + " already exists!")
		}

		obj.userID = system.users.amount
		if (obj.password == undefined) {
			console.warn("User password was not defined: it is set to 'default'")
		}
		obj.password = system.cryptography.sha_256(obj.password || "default")
		system.users[name] = obj
		if (system.folders[obj.baseDir] == undefined) {
			throw new Error("User base directory is not created")
		} else {
			system.folders.writeFolder(obj.homeDir)
		}
	}

	system.log(Name, "Starting Wrapper...")
	await system.startProcess("/boot/systemWrapper.js", {}, true)
	if (!system.systemWrapper) {
		system.error(Name, "systemWrapper not running! System may Behave Weirdly!")
	}

	system.log(Name, "Starting systemC...")
	await system.startProcess("/usr/bin/systemc/systemC.js", {}, true)
	if (!system.systemC) {
		system.error(Name, "systemC not running! System may Behave Weirdly!")
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

	system.log(Name, "Beginning to run processes...")

	system.runProcesses = function() {

		if (system.logsFocus == undefined) {
			system.input.focus()
		}

		if (system.preInput && system.logsFocus == undefined) {
			system.preInput.innerHTML = system.dir + " % "
		}

		const processIDs = Object.keys(system.processes)

		for (const i in processIDs) {
			const obj = system.processes[processIDs[i]]
			//console.log(obj)
			if (obj !== undefined) {
				if (String(obj.code).includes("frame()")) {
					try {
						if (obj.isUnsafe) {
							obj.frame(obj.variables, system)
						} else {
							obj.frame(obj.variables)
						}
					} catch(e) {
						system.error(Name + ": processRunner running " + obj.name, e)
					}
				} else {
					system.stopProcess(processIDs[i])
				}
			}
		}
	}

	var runtime = setInterval(system.runProcesses);

	setInterval(system.localFS.commit, 5000)
	setInterval(function() {
		system.files.writeFile("/etc/path.json", JSON.stringify(system.path))
		system.files.writeFile("/etc/passwd.json", JSON.stringify(system.users))
	}, 1000)
}

const system = ssm
init()