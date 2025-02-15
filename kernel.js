async function kernel() {
	const Name = "[ABSTRACT]/kernel.js"
	const PID = -1

	system = {startTime: Date.now()}
	system.safe = false
	system.forceSystemLog = true
	system.processes = []
	system.procCount = 0
	system.dir = "/"

	system.inputText = ""
	system.constellinux = {constellinux: "ckv0.1"}
	system.constellinux.terminal = system.constellinux.constellinux
	system.logsBox = document.getElementById("logsBox")
	system.logs = []
	logHTML = document.getElementById("termLOG")
	logsHTML = document.getElementById("logs")

	system.refreshLogsPanel = function() {
		let data = ""
		for (const i in system.logs) {
			let temp = "<p id='" + system.logs[i].type + "'>"
			temp += system.logs[i].content
			temp += "</p>"
			data += temp
		}
		system.logsBox.innerHTML = data
	}

	String.prototype.textAfter = function (after) {
		let res = ""
		for (let i = 0; i < this.length; i++) {
			res += this[i]
		}

		return res.substring(res.indexOf(after) + 1)
	}

	String.prototype.textBefore = function (before) {
		let res = ""
		for (let i = 0; i < this.length; i++) {
			res += this[i]
		}

		return res.substring(0, res.indexOf(before))
	}

	String.prototype.textAfterAll = function (after) {
		let res = ""
		for (let i = 0; i < this.length; i++) {
			res += this[i]
		}

		return res.split("").reverse().join("").textBefore(after).split("").reverse().join("")
	}
	
	system.cast = {}
	system.cast.Objectify = function Objectify(obj) {
		if (typeof obj === "object") {
			return obj;
		}
		try {
			return (JSON.parse(obj))
		} catch (e) {}
		try {
			return (obj)
		} catch (e) {}
	}

	system.cast.Stringify = function Stringify(str, beautify) {
		if (typeof str === "object") {
			if (beautify) {
				return JSON.stringify(str, null, 4);
			} else {
				return JSON.stringify(str);
			}
		}
		return (String(str))
	}

	system.log = function(origin, str) {
		let obj = {type: "log", origin: origin,  content: (origin || Name) + ": " +  system.cast.Stringify(str), origin: origin}
		system.logs.push(obj)
		console.log(system.logs[system.logs.length - 1].content)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}
	system.post = function(origin, str) {
		let obj = {type: "post", origin: origin,  content: system.cast.Stringify(str), origin: origin}
		system.logs.push(obj)
		console.log(system.logs[system.logs.length - 1].content)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}

	system.warn = function(origin, str) {
		let obj = {type: "warn", origin: origin,  content: (origin || Name) + ": " +  system.cast.Stringify(str), origin: origin}
		system.logs.push(obj)
		console.warn(system.logs[system.logs.length - 1].content)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}
	system.error = function(origin, str) {
		let obj = {type: "error", origin: origin, content: (origin || Name) + ": " +  system.cast.Stringify(str)}
		system.logs.push(obj)
		console.error(system.logs[system.logs.length - 1].content)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}

	system.editLog = function (origin, str, id) {
		let obj = ""
		switch (system.logs[id].type) {
			case "post":
				obj = {type: "post", content: system.cast.Stringify(str), origin: origin}
				break;
			default:
				obj = {type: system.logs[id].type, content: (origin || Name) + ": " +  system.cast.Stringify(str), origin: origin}
		}
		if (origin == system.logs[id].origin) {
			system.logs[id] = obj
			system.refreshLogsPanel()
		} else {
			system.warn("Program " + origin + " has attemped to overwrite a log of a different program, log ID: " + system.logs[id].origin)
		}
	}

	system.fetchURL = async function fetchURL(url) {
		console.log("fetchURL request to " + url)
		const response = await fetch(url);
		const data = await response.text();
		if (response.ok) {
			return data;
		} else {
			return undefined
		}
	}

	try {
		// https://patorjk.com/software/taag/#p=display&h=0&f=Doom&t=Constellinux 
		system.post("",String(" _____                     _          _  _  _                     \n/  __ \\                   | |        | || |(_)                    \n| /  \\/  ___   _ __   ___ | |_   ___ | || | _  _ __   _   _ __  __\n| |     / _ \\ | '_ \\ / __|| __| / _ \\| || || || '_ \\ | | | |\\ \\/ /\n| \\__/\\| (_) || | | |\\__ \\| |_ |  __/| || || || | | || |_| | >  < \n \\____/ \\___/ |_| |_||___/ \\__| \\___||_||_||_||_| |_| \\__,_|/_/\\_\\"))
		system.post(""," ")

		system.log(Name,"Starting JS Engine...")

		system.languages = {}
		system.langBackend = {}
		system.languages.js = function (dir) {
			let code = system.files.get(dir)
			if (system.forceSystemLog) {
				code = code.replaceAll("console.log(", "system.log(Name,")
				code = code.replaceAll("console.warn(", "system.warn(Name,")
				code = code.replaceAll("console.error(", "system.error(Name,")
			}
			return code
		}

		system.extend = function (pre, text) {
			let txt = String(text.replaceAll("\n","\n ")).split("(")
			let result = ""

			for (const i in txt) {
				let item = txt[i]
				if (Number(i) !== txt.length - 1) {
					if (item[item.length - 1] !== " ") {
						let tmp = item.split(" ").reverse()
						let post = tmp.splice(0,1)[0]
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
		system.stopProcess = function stopProcess(PID) {
			delete system.processes[PID]
		}

		system.toDir = function toDir(dir) {
			if (dir[0] == "/") {
				return (dir)
			} else {
				return (system.dir + "/" + dir)
			}
		}


		// START FILESYSTEM
		system.log(Name,"Registering Drive Functions.")
		system.folders = {}
		obj = {}
		obj.children = {}
		system.folders["/"] = obj
		system.files = {}
		system.files.count = 0

		system.files.writeFile = function writeFile(dirOld, content) {
			try {
				let dir = dirOld // use to replace ~ with home dir in future
				let location = dir.substr(0, dir.lastIndexOf("/"))
				if (location == "") {
					location = "/"
				}
				let filename = dir.substr(dir.lastIndexOf("/") + 1)
				let obj = {}
				obj.id = system.files.count
				system.files.count += 1
				obj.content = content
				system.folders[location].children[filename] = obj.id
				system.files[obj.id] = obj
			} catch (e) {
				system.error("Error Writing to File at " + dirOld + ": " + e)
				return false
			}
			return true
		}

		system.folders.writeFolder = function writeFolder(dirOld) {
			try {
				let dir = dirOld // use to replace ~ with home dir in future
				let location = dir.substr(0, dir.lastIndexOf("/"))
				if (location == "") {
					location = "/"
				}
				let foldername = dir.substr(dir.lastIndexOf("/") + 1)
				let obj = {}
				obj.children = {}
				system.folders[dir] = obj
				obj = {}
				obj.id = system.files.count
				system.files.count += 1
				obj.type = "folder"
				obj.content = dir
				system.folders[location].children[foldername] = obj.id
				system.files[obj.id] = obj
				console.log("Created Directory " + dirOld + " Successfully.", "writeFolder")
			} catch (e) {
				system.error("Error Creating Folder at " + dirOld + ": " + e)
				return false
			}
			return true
		}

		system.files.get = function get(dirOld) {
			try {
				if (dirOld === "") {
					return ""
				}
				let dir = dirOld // use to replace ~ with home dir in future
				let location = dir.substr(0, dir.lastIndexOf("/"))
				if (location == "") {
					location = "/"
				}
				let filename = dir.substr(dir.lastIndexOf("/") + 1)
				try {
					return system.files[system.folders[location].children[filename]].content
				} catch (e) {
					return (undefined)
				}
			} catch (e) {
				system.error("Error Reading File at " + dirOld + ": " + e)
				return
			}
		}

		system.folders.listDirectory = function listDirectory(dirOld) {
			try {
				let dir = dirOld // use to replace ~ with home dir in future
				let location = dir.substr(0, dir.lastIndexOf("/"))
				if (location == "") {
					location = "/"
				}
				if (location[location.length - 1] !== "/") {
					location += "/"
				}
				location += dir.substr(dir.lastIndexOf("/") + 1)
				return Object.keys(system.folders[location].children)
			} catch (e) {
				return []
			}
		}

		system.files.deleteFile = function deleteFile(dirOld) {
			try {
				let dir = dirOld // use to replace ~ with home dir in future
				let location = dir.substr(0, dir.lastIndexOf("/"));
				if (location == "") {
					location = "/"
				}
				let filename = dir.substr(dir.lastIndexOf("/") + 1);
				delete system.files[system.folders[location].children[filename]]
				delete system.folders[location].children[filename]
			} catch (e) {
				system.error("Error Deleting File File at " + dirOld + ": " + e)
				return
			}
		}

		system.log(Name,"Creating Basic Directories...")

		let list = await system.fetchURL("./index.json")

		folders = JSON.parse(list).folders
		for (const item in folders) {
			system.folders.writeFolder(folders[item])
		}

		system.log(Name,"Writing Default Files...")

		files = JSON.parse(list).files
		for (const item in files) {
			obj = await system.fetchURL("." + files[item])
			system.files.writeFile(files[item], obj)
		}

		system.log(Name,"Starting systemC...")
		system.startProcess("/usr/bin/systemc/systemC.js").then()
		if (!system.systemC) {
			system.error("systemC not running.")
			return
		}
		system.log(Name,"Beginning to run processes...")

		system.input = document.getElementById('input');
		system.input.focus()
		system.preInput = document.getElementById('preInput');
		system.preInput.innerText = system.dir + " % " + system.inputText

		// INPUT
		system.keys = {}
		document.addEventListener('keydown', (e) => {
			system.keys[e.key] = true
			if(e.keyCode == 32 && e.target == document.body) {
				e.preventDefault();
			}
			let temp = String(system.inputText)
			let cmdKey = "Control"
			if (navigator.userAgentData.platform == "macOS") {
				cmdKey = "Meta"
			}
			if (system.keys[cmdKey]) {
				switch(e.key) {
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
			system.post(pre + code)
			let segments = String(code).split(" ")
			if (system.files.get("/bin/" + segments[0] + ".js") == undefined) {
				//system.log(Name,"command not found:  " + segments[0])
				system.post(eval(code))
			} else {
				system.startProcess("/bin/" + segments[0] + ".js", segments.slice(1))
			}
		}



		var runtime = setInterval(function() {
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
	} catch (e) {
		system.error("KERNEL PANIC - " + e)
	}
}

kernel()