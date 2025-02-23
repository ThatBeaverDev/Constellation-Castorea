// bootloader for Constellinux.

function checkIfCompatible() {
    let obj = {
        isCompatible: true
    }
    if (window.showSaveFilePicker == undefined) {
        obj.isCompatible = false
        obj.reason = "File_System_API"
    }
    if ((crypto || {}).subtle == undefined) {
        obj.isCompatible = false
        obj.reason = "Crypto/subtle"
    }
    return obj
}


async function loader() {

	const Name = "/boot/loader.js"
	const PID = -1

	system = {
		startTime: Date.now()
    }
    system.baseURI = "."

	system.safe = false
	system.forceSystemLog = true
	system.processes = []
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
		let obj = {
			type: "log",
			origin: origin,
			content: (origin || Name) + ": " + system.cast.Stringify(str),
			origin: origin
		}
		system.logs.push(obj)
		console.log(system.logs[system.logs.length - 1].content)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}
	system.post = function(origin, str) {
		let obj = {
			type: "post",
			origin: origin,
			content: system.cast.Stringify(str),
			origin: origin
		}
		system.logs.push(obj)
		console.log(system.logs[system.logs.length - 1].content)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}

	system.warn = function(origin, str) {
		let obj = {
			type: "warn",
			origin: origin,
			content: (origin || Name) + ": " + system.cast.Stringify(str),
			origin: origin
		}
		system.logs.push(obj)
		console.warn(system.logs[system.logs.length - 1].content)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}
	system.error = function(origin, str) {
		let obj = {
			type: "error",
			origin: origin,
			content: (origin || Name) + ": " + system.cast.Stringify(str)
		}
		system.logs.push(obj)
		console.error(system.logs[system.logs.length - 1].content)
		system.refreshLogsPanel()
		return system.logs.length - 1
	}

	system.editLog = function(origin, str, id) {
		let obj = ""
		switch (system.logs[id].type) {
			case "post":
				obj = {
					type: "post",
					content: system.cast.Stringify(str),
					origin: origin
				}
				break;
			default:
				obj = {
					type: system.logs[id].type,
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

    obj = checkIfCompatible()

    if (!obj.isCompatible) {
        system.error(Name,"Sorry, but your browser is not compatible with This System.")
        system.error(Name,'Reason is your browser does not support <a href="https://developer.mozilla.org/en-US/docs/Web/API/' + obj.reason + '">' + obj.reason + '</a>')
        document.getElementById("preInput").innerText = ""
        return
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

	system.setParam = function(name, value) {
		var s = new URLSearchParams(location.search);
		s.set(String(name), String(value));
		history.replaceState("", "", "?" + s.toString());
	}

	system.getParam = function(name) {
		return new URLSearchParams(location.search).get(String(name))
	}


	// START FILESYSTEM
	system.folders = {} // foldersSet
	obj = {}
	obj.children = {}
	system.folders["/"] = obj
	system.files = {} // filesSet
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
			obj.content = system.cryptography.aesCtrEncrypt(content, 'ConstellinuxEncode', 256)
			system.folders[location].children[filename] = obj.id
			system.files[obj.id] = obj
			system.localFS.updated = true
		} catch (e) {
			system.error("Error Writing to File at " + dirOld + ": " + e)
			return false
		}
		return true
	}

	system.files.move = function(dirOld, dirNew) {
		// old directory for file
		let dirO = dirOld // use to replace ~ with home dir in future
		let locationOld = dirO.substr(0, dirO.lastIndexOf("/"))
		if (locationOld == "") {
			locationOld = "/"
		}
		let filenameOld = dirO.substr(dirO.lastIndexOf("/") + 1)
		// new directory for file
		let dirN = dirNew // use to replace ~ with home dir in future
		let locationNew = dirN.substr(0, dirN.lastIndexOf("/"))
		if (locationNew == "") {
			locationNew = "/"
		}
		let filenameNew = dirN.substr(dirN.lastIndexOf("/") + 1)

		const id = system.folders[locationOld].children[filenameOld] // copy the ID of the file
		console.log(id)
		delete system.folders[locationOld].children[filenameOld] // delete the old link
		system.folders[locationNew].children[filenameNew] = id // create the new link
		system.localFS.updated = true
	}

	system.files.copy = function(dirOld, dirNew) {
		// old directory for file
		let dirO = dirOld // use to replace ~ with home dir in future
		let locationOld = dirO.substr(0, dirO.lastIndexOf("/"))
		if (locationOld == "") {
			locationOld = "/"
		}
		let filenameOld = dirO.substr(dirO.lastIndexOf("/") + 1)
		// new directory for file
		let dirN = dirNew // use to replace ~ with home dir in future
		let locationNew = dirN.substr(0, dirN.lastIndexOf("/"))
		if (locationNew == "") {
			locationNew = "/"
		}
		let filenameNew = dirN.substr(dirN.lastIndexOf("/") + 1)
		system.localFS.updated = true
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
			console.log("Created Directory " + dirOld + " Successfully.")
			system.localFS.updated = true
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
				return system.cryptography.aesCtrDecrypt(system.files[system.folders[location].children[filename]].content, 'ConstellinuxEncode', 256)
			} catch (e) {
				return (undefined)
			}
		} catch (e) {
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
			system.localFS.updated = true
		} catch (e) {
			system.error("Error Deleting File File at " + dirOld + ": " + e)
			return
		}
	}

	// run cryptography so we can actually write to files

	const crypt = await system.fetchURL('./usr/bin/cryptography/cryptography.js')
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
        if (!system.localFS.updated) {
            return
        }
        system.localFS.updated = false
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
		const writeData = JSON.stringify(data)

		// write our file
		await writableStream.write(writeData);

		// close the file and write the contents to disk.
		await writableStream.close();
        console.log("Filesystem commited to hostOS")
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
			bootOS(system.options[system.selection])
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

async function bootOS(osName) {
    // delete bootloader keys
	delete system.progress
	delete system.selection
	delete system.options
	let castoreaKernel

	system.logs = []

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
			eval(castoreaKernel)
			break;
		case "new":
			system.fileHandle = await window.showSaveFilePicker(system.localFS.options)
			system.isNew = true

            // fetch kernel since it's not present yet to be ran
            try {
                system.folders.writeFolder("/boot")
            } catch(e) {}
            const kern = await system.fetchURL(system.baseURI + "/boot/kernel.js")
            system.files.writeFile("/boot/kernel.js", kern)
            castoreaKernel = system.files.get("/boot/kernel.js")

			eval(castoreaKernel)
			setTimeout(function() {
				system.localFS.commit()
			}, 1000)
			break;
		default:
			throw new Error("Unknown OS: " + osName)
	}
}

loader()