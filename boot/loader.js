// bootloader for Constellinux.

function checkIfCompatible() {
    let obj = {
        isCompatible: true
    }
    if ((crypto || {}).subtle == undefined) {
        obj.isCompatible = false
        obj.reason = "Crypto/subtle"
		obj.showReason = "crypto.subtle"
    }
    return obj
}

function mustBootWithoutFSAPI() {
	obj = {
		noFS: false
	}
	if (window.showSaveFilePicker == undefined) {
        obj.noFS = true
        obj.reason = "File_System_API"
		obj.showReason = "Filesystem API"
    }
	return obj
}


async function loader() {

	const Name = "/boot/loader.js"
	const PID = -1

	const system = {
		startTime: Date.now()
    }

    system.baseURI = "."

	system.safe = false
	system.forceSystemLog = true
	system.processes = {}
	system.procCount = 0
	system.dir = "/"

	system.inputText = ""
	system.constellinux = {
        loader: "v0.1"
    }
	system.logsBox = document.getElementById("logsBox")
	system.logs = []
	logHTML = document.getElementById("termLOG")
	logsHTML = document.getElementById("logs")

	system.refreshLogsPanel = function(text) {
		if (system.logsFocus == undefined) {
			let data = ""
	
			if (system.logs.length > 5000) {
				//system.warn(Name,"Logs length is over 100,000")
				system.logsBox.innerHTML = "Logs are too long to be displayed."
				console.log(system.logs.length)
				return
			}
	
			for (const i in system.logs) {
				let temp = "<p id='" + system.logs[i].type + "'>"
				temp += system.logs[i].content
				temp += "</p>"
				data += temp
			}
				
			system.logsBox.innerHTML = data
		} else {
			if (typeof system.processes[system.logsFocus] !== "object") {
				delete system.logsFocus
				system.refreshLogsPanel()
			}

			if (text == undefined) return
			system.logsBox.innerHTML = text
			system.preInput.innerHTML = ""
		}
	}

	String.prototype.textAfter = function(after) {
		let res = ""
		for (let i = 0; i < this.length; i++) {
			res += this[i]
		}

		return res.substring(res.indexOf(after) + 1)
	}

	String.prototype.textBefore = function(before) {
		let res = ""
		for (let i = 0; i < this.length; i++) {
			res += this[i]
		}

		return res.substring(0, res.indexOf(before))
	}

	String.prototype.textAfterAll = function(after) {
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
		const obj = {
			type: "log",
			origin: origin,
			content: (origin || Name) + ": " + system.cast.Stringify(str),
			origin: origin
		}
		system.logs.push(obj)
		console.log(str)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}
	system.post = function(origin, str) {
		const obj = {
			type: "post",
			origin: origin,
			content: system.cast.Stringify(str),
			origin: origin
		}
		system.logs.push(obj)
		console.log(str)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}

	system.warn = function(origin, str) {
		const obj = {
			type: "warn",
			origin: origin,
			content: (origin || Name) + ": " + system.cast.Stringify(str),
			origin: origin
		}
		system.logs.push(obj)
		console.warn(str)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}
	system.error = function(origin, str) {
		console.error(`Error in ${ origin }:`)
		console.error(str)
		const obj = {
			type: "error",
			origin: origin,
			content: (origin || Name) + ": " + system.cast.Stringify(str)
		}
		system.logs.push(obj)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}

	system.editLog = function(origin, str, id, newType) {
		let obj = ""
		switch (system.logs[id].type) {
			case "post":
				obj = {
					type: (newType || "post"),
					content: system.cast.Stringify(str),
					origin: origin
				}
				break;
			default:
				obj = {
					type: (newType || system.logs[id].type),
					content: (origin || Name) + ": " + system.cast.Stringify(str),
					origin: origin
				}
		}
		if (origin == system.logs[id].origin) {
			system.logs[id] = obj
			system.refreshLogsPanel()
		} else {
			system.warn("Program " + origin + " has attemped to overwrite a log of a different program, log ID: " + system.logs[id].origin)
		}
	}

	system.setParam = function(name, value) {
		var s = new URLSearchParams(location.search);
		s.set(String(name), String(value));
		history.replaceState("", "", "?" + s.toString());
	}

	system.getParam = function(name) {
		return new URLSearchParams(location.search).get(String(name))
	}

    obj = checkIfCompatible()

    if (!obj.isCompatible) {
        system.error(Name,"Sorry, but your browser is not compatible with This System.")
		if (obj.showReason == undefined) obj.Showreason = obj.reason
        system.error(Name,'Reason is your browser does not support <a href="https://developer.mozilla.org/en-US/docs/Web/API/' + obj.reason + '">' + obj.showReason + '</a>')
        document.getElementById("preInput").innerText = ""
        return
    }

	system.fsAPI = true

	system.development = Boolean(system.getParam("dev"))

	if (system.development) {
		system.fsAPI = false // so I don't have to constantly make a new system to update it
		window.sse = system // security be damned
	}

	obj = mustBootWithoutFSAPI()

	console.log(obj)

	if (obj.noFS) {
		system.warn(Name, "Attempting to boot without the filesystem API, things might get a bit rocky...")
		system.fsAPI = false
	}

    delete obj

	system.fetchURL = async function fetchURL(url) {
		console.log("fetchURL request to " + url)
		const response = await fetch(url);
		const data = await response.text();
		if (response.ok) {
			return data;
		} else {
            console.warn(response)
			return undefined
		}
	}


	// START FILESYSTEM
	system.folders = {} // foldersSet
	obj = {}
	obj.id = 0
	obj.contents = "/"
	obj.directory = "/"
	obj.children = {}
	system.folders["/"] = obj
	system.files = {} // filesSet
	system.files.count = 1
	system.files.encrypt = true

	function getDirInfo(dirOld) {
		const obj = {}
		let dir = String(dirOld) // use to replace ~ with home dir in future
		let location = dir.substring(0, dir.lastIndexOf("/"))
		if (location == "") {
			location = "/"
		}
		obj.location = location
		obj.filename = dir.substring(dir.lastIndexOf("/") + 1)
		obj.dir = dir

		obj.parent = system.folders[obj.location]
		obj.link = obj.parent.children[obj.filename]
		if (obj.link == undefined) {
			obj.body = undefined
		} else {
			obj.body = system.files[obj.link.id]
		}
		return obj
	}

	system.files.writeFile = function writeFile(dir, content) {
		try {
			const obj = getDirInfo(dir)

			const folder = system.folders[obj.location].children

			let id

			if (folder[obj.filename] !== undefined) {
				// file already exists, just overwrite the contents
				id = folder[obj.filename].id

				system.files[id].contents = system.cryptography.aesCtrEncrypt(content, "ConstellinuxEncode", 256)
			} else {
				// file doesn't already exist here
				id = system.files.count

				// create file link
				const fileLink = {}
				fileLink.id = id
				fileLink.type = "file"
				// add to FS
				folder[obj.filename] = fileLink

				// create file
				const file = {}
				file.id = id
				file.type = "file"
				file.directory = obj.dir
				if (system.files.encrypt) {
					file.contents = system.cryptography.aesCtrEncrypt(content, "ConstellinuxEncode", 256)
				} else {
					file.contents = content
				}
				// add to FS
				system.files[id] = file

				system.files.count++
			}
	
		} catch (e) {
			system.error(Name, "Error Writing to File at " + dir + ": " + e)
			return false
		}
		return true
	}

	system.folders.writeFolder = function writeFolder(dir) {
		try {
			const obj = getDirInfo(dir)

			const fldr = obj.parent.children

			let id
			
			id = system.files.count

			// create file link
			const fileLink = {}
			fileLink.id = id
			fileLink.type = "folder"
			// add to FS
			fldr[obj.filename] = fileLink

			// create 'file'
			const file = {}
			file.id = id
			file.type = "folder"
			file.directory = obj.dir
			system.files[id] = file

			// create folder
			const folder = {}
			folder.id = id
			folder.contents = obj.dir
			folder.directory = obj.dir
			folder.children = {}
			// add to FS
			system.folders[obj.dir] = folder

			system.files.count++
		} catch (e) {
			system.error(Name, "Error Creating Folder at " + dir + ": " + e)
			return false
		}
		return true
	}

	system.files.get = function get(dir) {
		try {
			switch(dir) {
				case "/dev/null":
					return null
				case "/dev/urandom":
					return Math.random()
				default:
					// get dir info
					const obj = getDirInfo(dir)
					
					const folder = system.folders[obj.location].children
		
					const fileLink = folder[obj.filename]
		
					if (fileLink == undefined) {
						return
					}
		
					if (fileLink.type !== "file") {
						return "Type is not file"
					}
		
					const file = system.files[fileLink.id]
		
					if (system.files.encrypt) {
						return system.cryptography.aesCtrDecrypt(file.contents, "ConstellinuxEncode", 256)
					} else {
						return file.contents
					}
			}
		} catch (e) {
			return
		}
	}

	system.folders.listDirectory = function listDirectory(dirOld) {
		try {
			let dir = String(dirOld) // use to replace ~ with home dir in future
			let location = dir.substring(0, dir.lastIndexOf("/"))
			if (location == "") {
				location = "/"
			}
			if (location[location.length - 1] !== "/") {
				location += "/"
			}
			location += dir.substring(dir.lastIndexOf("/") + 1)
			return Object.keys(system.folders[location].children)
		} catch (e) {
			return []
		}
	}

	system.folders.isDirectory = function isDirectory(dir) {
		try {
			if (dir == "/") {
				return true
			}

			const obj = getDirInfo(dir)
			const parent = system.folders[obj.location].children
			const directory = parent[obj.filename]
			return directory.type == "folder"

		} catch(e) {
			system.error(Name, "Error Checking if location is directory for " + String(dir) + ": " + e)
			return undefined
		}
	}

	system.folders.deleteDirectory = function deleteDirectory(dir, recursive, verbose) {
		try {
			const obj = getDirInfo(dir)

			const parent = system.folders[obj.location]

			const folder = system.folders[obj.dir]
			
			if (!recursive && Object.keys(folder.children).length !== 0) {
				return {
					result: false,
					reason: "Directory contains files / folders and recursivity is disabled."
				}
			}

			function deleteDir(dir, verbose) {
				const obj = getDirInfo(dir)

				const folder = system.folders[obj.dir]
				const kids = folder.children
				const children = Object.keys(kids)
				
				for (const i in children) {
					let fullDir
					if (obj.dir == "/") {
						fullDir = obj.dir + children[i]
					} else {
						fullDir = obj.dir + "/" + children[i]
					}
					if (verbose) {
						system.post(Name, fullDir)
					}

					if (system.folders.isDirectory(fullDir)) {
						deleteDir(fullDir, verbose)
					} else {
						system.files.deleteFile(fullDir)
					}
				}

				delete system.files[folder.id]
				delete system.folders[obj.location].children[obj.filename]
				delete system.folders[obj.dir]
			}

			deleteDir(obj.dir, verbose)
		} catch(e) {
			system.error(Name, "Error deleting directory for " + String(dir) + ": " + e)
			return false
		}
	}

	system.files.deleteFile = function deleteFile(dir) {
		try {
			const obj = getDirInfo(dir)

			const parent = system.folders[obj.location]

			const link = parent.children[obj.filename]
			
			const file = system.files[link.id]

			delete system.files[link.id] // file
			delete parent.children[obj.filename] // link
		} catch (e) {
			system.error(Name, "Error Deleting File File at " + String(dir) + ": " + e)
			return
		}
	}

	// run cryptography so we can actually write to files

	const crypt = await system.fetchURL(system.baseURI + '/boot/cryptography.js') // cryptoFetch
	eval(crypt)

	system.localFS = {}

	system.localFS.options = {
		startIn: 'documents',
		suggestedName: 'Constellinux System.csys',
		types: [{
			description: "Constellinux Systems",
			accept: {
				"text/plain": [".csys"],
			},
		}, ],
		excludeAcceptAllOption: true,
		multiple: false,
	};

	// function to write to file
	system.localFS.commit = async function() {
		// check we have a filehandle, if not get one
		if (system.fileHandle == undefined) {
			system.fileHandle = await window.showSaveFilePicker()
		}


		// create a FileSystemWritableFileStream to write to
		const writableStream = await system.fileHandle.createWritable();

		// build data to commit to file
		const data = {}
		data.folders = system.folders
		data.files = system.files
		const writeData = JSON.stringify(data, null, 4)

		// write our file
		await writableStream.write(writeData);

		// close the file and write the contents to disk.
		await writableStream.close();
        console.log("Filesystem commited to hostOS")
	}

	if (!system.fsAPI) {
		system.localFS.commit = async function () {}
	}

	system.warn(Name, "OS Will not boot if you do not select a file to boot.")

	const handle = (e) => {
		switch (e.key) {
			case "Enter":
				e.preventDefault();
				system.progress = true
				break;
			case "ArrowUp":
				system.selection--
				e.preventDefault();
				break;
			case "ArrowDown":
				e.preventDefault();
				system.selection++
				break;
		}
	}

	if (!system.fsAPI) {
		bootOS("New", system)
		return
	}

	document.addEventListener('keydown', handle)

	system.progress = false
	system.selection = 0
	system.options = ["Open", "New"]
	document.getElementById('preInput').innerText = "Select an option from above to boot."

	const options = system.post(Name, "")
	let exit = false
	setInterval(function() {
		if (exit) {
			return
		}
		if (system.progress) {
            try {
			bootOS(system.options[system.selection], system)
			document.removeEventListener('keydown', handle)
			exit = true
            } catch(e) {
                console.error(e)
                system.progress = false
            }
			return;
		} else {
			if (system.selection < 0) {
				system.selection = 0
			} else if (system.selection > system.options.length - 1) {
				system.selection = system.options.length - 1
			}
			const opt = JSON.parse(JSON.stringify(system.options))
			opt[system.selection] = "> " + opt[system.selection]
			system.editLog(Name, opt.join("\n"), options)
		}
	}, 100)

}

async function bootOS(osName, ssm) {
	const system = ssm
    // delete bootloader keys
	delete system.progress
	delete system.selection
	delete system.options
	let castoreaKernel

	switch (String(osName).toLowerCase()) {
		case "open":
			// open file picker
			[system.fileHandle] = await window.showOpenFilePicker(system.localFS.options);
			const fileData = await system.fileHandle.getFile();

			// extract the text of the file
			const text = await fileData.text()
			const sys = JSON.parse(text)

			system.folders = {
				...system.folders,
				...sys.folders
			}
			system.files = {
				...system.files,
				...sys.files
			}

            // run kernel
            castoreaKernel = system.files.get("/boot/kernel.js")
			break;
		case "new":
			if (system.fsAPI) {
				system.fileHandle = await window.showSaveFilePicker(system.localFS.options)
			}
			system.isNew = true

            // fetch kernel since it's not present yet to be ran
        	system.folders.writeFolder("/boot")
            const kern = await system.fetchURL(system.baseURI + "/boot/kernel.js") // kernel download
            system.files.writeFile("/boot/kernel.js", kern)
            castoreaKernel = system.files.get("/boot/kernel.js")

			break;
		default:
			throw new Error("Unknown Case: " + osName)
	}
	castoreaKernel = new Function("ssm", castoreaKernel)
	castoreaKernel(system)
	
}

try {
	loader()
} catch(e) {
	document.getElementById("logsBox").innerText = e.stack
}