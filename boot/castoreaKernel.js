async function init() {
	const Name = "/boot/castoreaKernel.js"
	const PID = -1

	system.name = "nordOS"

	let obj = {}
	obj.PID = -1
	obj.parent = -1
	obj.children = []
	obj.name = "/boot/castoreaKernel.js"
	obj.isUnsafe = true
	obj.args = []
	obj.hasFrame = true
	obj.variables = {}
	obj.variables.shared = {}
	obj.variables.shared.log = system.log
	obj.variables.shared.warn = system.warn
	obj.variables.shared.error = system.error
	obj.variables.shared.post = system.post
	obj.variables.shared.editLog = system.editLog

	system.processes[PID] = obj

	//try {
	system.logs = []

	system.versions.castoreaKernel = "v0.3.0"
	system.versions.terminal = system.versions.castoreaKernel
	system.hostname = "nordOS"

	// https://patorjk.com/software/taag/#p=display&h=0&f=Doom&t=nordOS 
	system.post("", String("\n                         _  _____  _____ \n                        | ||  _  |/  ___|\n _ __    ___   _ __   __| || | | |\\ `--. \n| '_ \\  / _ \\ | '__| / _` || | | | `--. \\\n| | | || (_) || |   | (_| |\\ \\_/ //\\__/ /\n|_| |_| \\___/ |_|    \\__,_| \\___/ \\____/ \n                                         \n                                         "))
	system.post("", " ")
	//document.getElementById('preInput').innerText = "Please wait..."

	system.temp = await system.fetchURL("https://thatbeaverdev.github.io/beaverUtils.js")
	eval(system.temp)
	delete system.temp

	system.log(Name, "Starting JS Engine...")

	system.languages = {}
	system.langBackend = {} // need to remove but CRL needs it
	system.languages.js = function (dir, safe) {
		// code provided by node

		// code gets provided 'dir' and 'safe'
		let script = system.fs.readFile(dir)

		if (system.forceSystemLog) {
			if (system.systemWrapper) {
				script = script.replaceAll("console.log(", "parent.log(Name,")
				script = script.replaceAll("console.post(", "parent.post(Name,")
				script = script.replaceAll("console.warn(", "parent.warn(Name,")
				script = script.replaceAll("console.error(", "parent.error(Name,")
				script = script.replaceAll("console.edit(", "parent.editLog(Name,")

				for (const i in csw.functions) {
					script = script.replaceAll(csw.functions[i] + "(", csw.functions[i] + "(token,")
				}
			} else {
				script = script.replaceAll("console.log(", "parent.log(Name,")
				script = script.replaceAll("console.post(", "parent.post(Name,")
				script = script.replaceAll("console.warn(", "parent.warn(Name,")
				script = script.replaceAll("console.error(", "parent.error(Name,")
				script = script.replaceAll("console.edit(", "parent.editLog(Name,")
			}
		}

		return script
	}

	system.extend = function (pre, text) {
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

	system.asyncFunction = Object.getPrototypeOf(async function () { }).constructor;

	system.startProcess = async function (parentPID, dir, args, isUnsafe) {
		if (system.fs.readFile(dir) == undefined) {
			return
		}
		let preScript = "const PID = " + system.maxPID + ";"
		preScript += "const Name = '" + dir + "';"
		preScript += "const args = JSON.parse('" + JSON.stringify((args || [])) + "');"
		preScript += "const elevated = " + !isUnsafe + ";"
		preScript += "const token = " + 0 + ";"
		preScript += "const local = lcl;"
		preScript += "const parent = prn;"
		if (isUnsafe) {
			preScript += "const system = ssm;"
		}
		let code
		let type = "js"
		const file = system.fs.readFile(dir)
		if (file.substring(0, 3) == "#! ") {
			const split = file.split("\n")
			const handler = split[0].substring(3)
			const handleFunc = new Function("code", "safe", "system", system.fs.readFile(handler) + "\n\nreturn compile()")
			split.shift()
			code = handleFunc(split.join("\n"), !isUnsafe, system)
		} else {
			type = String(dir).substring(String(dir).indexOf(".") + 1)
			try {
				code = system.languages[type](dir)
			} catch (e) {
				system.error(`Error hit trying to compile script ${dir}, language: '${type}'`)
			}
		}


		const obj = {}

		obj.PID = system.maxPID
		const PID = obj.PID
		obj.parent = parentPID
		obj.children = []
		obj.name = dir
		obj.isUnsafe = isUnsafe
		obj.args = args
		obj.variables = {
			shared: {
				name: dir.textAfterAll("/")
			}
		}


		code = preScript + code
		obj.code = code

		obj.hasFrame = obj.code.includes("frame()")

		obj.display = `<p>Application ${dir}, PID ${PID} has no display output.`

		system.systemWrapper = Boolean(system.systemWrapper)

		// so we can make an Async function for init
		const AsyncFunction = system.asyncFunction

		if (isUnsafe) {
			if (system.safe && system.systemWrapper) {
				// safe mode, unsafe and systemWrapper
				obj.frame = new Function("lcl", "prn", "ssm", obj.code + "\ntry {  frame(args) } catch(e) {  parent.error(token, Name, e)  }")
				obj.init = new AsyncFunction("lcl", "prn", "ssm", obj.code + "\ntry {  await init(args) } catch(e) {  parent.error(token, Name, e)  }")
			}

			if (!system.safe) {
				// no safe mode, unsafe
				obj.frame = new Function("lcl", "prn", "ssm", obj.code + "\nframe(args)")
				obj.init = new AsyncFunction("lcl", "prn", "ssm", obj.code + "\nawait init(args)")
			}
		} else {
			if (system.safe) {
				// safe mode, not unsafe
				obj.frame = new Function("lcl", "prn", obj.code + "\ntry {  frame(args) } catch(e) {  parent.error(Name, e)  }")
				obj.init = new AsyncFunction("lcl", "prn", obj.code + "\ntry {  await init(args) } catch(e) {  parent.error(Name, e)  }")
			}

			if (!system.safe) {
				// no safe mode, not unsafe
				obj.frame = new Function("lcl", "prn", obj.code + "\nframe(args)")
				obj.init = new AsyncFunction("lcl", "prn", obj.code + "\nawait init(args)")
			}
		}

		system.processes[obj.PID] = obj
		system.processes[obj.parent].children.push(obj.PID)
		system.maxPID++

		const count = system.maxPID - 1
		if (isUnsafe) {
			await obj.init(system.processes[count].variables, system.processes[obj.parent].variables.shared, system)
		} else {
			await obj.init(system.processes[count].variables, system.processes[obj.parent].variables.shared)
		}

		return count
	}

	system.stopProcess = function (PID) {
		if (Number(PID) == -1) return

		const obj = system.processes[Number(PID)]

		if (system.focus.includes(Number(PID))) {
			console.log(`Process ${PID} has display focus. Removing.`)
			system.focus = system.focus.filter(item => Number(item) !== Number(PID))

			// refresh the display.
			system.refreshDisplay()
		}

		for (const i in obj.children) {
			system.stopProcess(obj.children[i])
		}

		const parentChildren = system.processes[obj.parent].children
		const index = parentChildren.indexOf(PID)
		parentChildren.splice(index, 1)

		delete system.processes[Number(PID)]
	}

	system.toDir = function toDir(dir, baseDir) {
		if (baseDir == undefined) {
			throw new Error(`baseDir mist be defined: while casting ${dir} to dir.`)
		}

		if (dir[0] == "/") {
			return dir
		} else if (baseDir.at(-1) == "/") {
			return baseDir + dir
		}
		return baseDir + "/" + dir
	}

	if (system.isNew) {
		system.log(Name, "Creating Basic Directories...")

		let list = await system.fetchURL(system.baseURI + "/index.json")
		folders = JSON.parse(list).folders
		for (const item in folders) {
			system.fs.writeFolder(folders[item])
		}

		system.log(Name, "Writing Default Files...")

		files = JSON.parse(list).files
		for (const item in files) {
			if (typeof files[item] == "object") {
				obj = await system.fetchURL(system.baseURI + files[item].dir)
				if (files[item].parse) {
					obj = JSON.parse(obj)
				}
				system.fs.writeFile(files[item].dir, obj)
			} else {
				obj = await system.fetchURL(system.baseURI + files[item])
				system.fs.writeFile(files[item], obj)
			}
		}

		// fetch Aurora (package manager)
		obj = await system.fetchURL(system.baseURI + "/boot/aurora-min.js")
		system.fs.writeFile("/bin/aurora.js", obj)
	} else {
		system.fs.deleteFolder("/var", true)
		system.fs.writeFolder("/var")
		system.fs.writeFolder("/var/crash")
	}

	system.fs.writeFile("/var/log", system.logs)
	system.logs = system.fs.readFile("/var/log")
	system.refreshLogsPanel()

	// initiate PATH

	system.path = system.fs.readFile("/etc/path.json")

	if (system.isNew) {
		// install system
		let packages = await system.fetchURL(system.baseURI + "/index.json")
		const index = JSON.parse(packages).packages

		// source the repo
		await system.startProcess(PID, "/bin/aurora.js", ["source", "../aurora/pkgs", "as", "default"], true)

		await system.startProcess(PID, "/bin/aurora.js", ["install", index, "-s"], true)
		system.log(Name, "System successfully Installed!")
	}

	// start user system
	system.user = "root"
	system.users = system.fs.readFile("/etc/passwd")

	// function to register users
	system.users.register = function (name, object) {

		const obj = JSON.parse(JSON.stringify(object))

		if (system.users[name] !== undefined) {
			throw new Error("user named " + name + " already exists!")
		}

		obj.userID = system.users.amount
		if (obj.password == undefined) {
			system.warn(Name, "User password was not defined: it is set to 'default'")
			obj.password = "default"
		}
		obj.password = system.cryptography.sha_256(obj.password)

		if (obj.permissions == undefined) {
			obj.permissions = {}
		}
		const p = obj.permissions
		p.all = (p.all || false)
		p.read = (p.read || false)
		p.write = (p.write || false)
		p.delete = (p.delete || false)

		system.users[name] = obj
		if (system.fs[obj.baseDir] == undefined) {
			throw new Error(`User base directory (${obj.baseDir}) is not created`)
		} else {
			const d = obj.homeDir
			system.fs.writeFolder(d)
			system.fs.writeFolder(d + "/.profile")
			system.fs.writeFolder(d + "/.config")
		}

		return true
	}

	if (system.isNew) {
		system.log(Name, "Creating root user...")
		system.users.register('root', {
			password: "admin",
			userID: 0,
			groupID: 0,
			otherInfo: {},
			baseDir: "/",
			homeDir: "/root",
			shell: "/bin/aquila.js",
			fullName: "root",
			permissions: {
				all: true,
				read: true,
				write: true,
				delete: true
			}
		})
	}

	system.focus = []
	system.fcs = undefined

	system.display = document.getElementById("display")

	system.refreshDisplay = function () {
		if (system.focus.length !== 0) {
			system.display.innerHTML = system.processes[system.fcs].display
		} else {
			system.display.innerHTML = "No Application is outputting display information. Sorry, You'll have to restart the system, there is no real way to access a CLI from here."
		}
	}

	system.log(Name, "Starting systemC...")
	await system.startProcess(PID, "/usr/bin/systemc/systemC.js", {}, true)
	if (!system.systemC) {
		system.error(Name, "systemC not running! System may Behave Weirdly!")
	}

	system.log(Name, "Beginning to run processes...")

	system.runProcesses = function () {
		const runnerStart = Date.now()
		system.fcs = system.focus[system.focus.length - 1]

		const processes = Object.keys(system.processes)

		for (const i in processes) {
			const obj = system.processes[processes[i]]
			// only run if defined and not the kernel
			if (obj !== undefined && obj.PID !== -1) {
				// run if there's a frame, if not terminate.
				if (String(obj.code).includes("frame()")) {
					const startTime = Date.now()
					// catch errors so one program can't crash them all
					try {
						const parent = system.processes[obj.parent]
						const sharedVariables = parent.variables["shared"]

						// run it
						if (obj.isUnsafe) {
							obj.frame(obj.variables, sharedVariables, system)
						} else {
							obj.frame(obj.variables, sharedVariables)
						}

					} catch (e) {
						console.error(Name + ": processRunner running " + obj.name, e)
					}
					const endTime = Date.now()
					const time = endTime - startTime
					obj.time = time
				} else {
					system.stopProcess(processes[i])
				}
			}
		}
		const runnerEnd = Date.now()
		const runnerTime = runnerEnd - runnerStart
		system.time = runnerTime
	}

	var runtime = setInterval(system.runProcesses);

	setInterval(system.localFS.commit, 5000)
	//} catch (e) {
	//	throw new Error("Kernel Panic - " + e)
	//}
}

const system = ssm
init()