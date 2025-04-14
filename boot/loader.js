// bootloader for nordOS / nordOS Based Systems.

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
	system.maxPID = 0

	system.inputText = ""
	system.versions = {
		loader: "v0.3.0"
	}
	system.logsBox = document.getElementById("logsBox")
	system.logs = []
	logHTML = document.getElementById("termLOG")
	logsHTML = document.getElementById("logs")

	system.refreshLogsPanel = function (text) {
		if (system.logsFocus == undefined) {
			let data = ""

			for (const i in system.logs) {
				let temp = "<p id='" + system.logs[i].type + "'>"
				temp += system.logs[i].content
				temp += "</p>"
				data += temp
			}

			//system.logsBox.innerHTML = data // comment out to remove the logsbox
			return data
		} else {
			if (typeof system.processes[system.logsFocus] !== "object") {
				delete system.logsFocus
				system.refreshLogsPanel()
			}

			if (text == undefined) return
			//system.logsBox.innerHTML = text // also comment out to remove the logsbox
			try {
				system.preInput.innerHTML = ""
			} catch (e) {
				// this is going to error, let's embrace it
			}
			return text
		}
	}

	system.log = function (origin, str) {
		const obj = {
			type: "log",
			origin: origin,
			content: (origin || Name) + ": " + system.cast.Stringify(str)
		}
		system.logs.push(obj)
		console.log(str)
		system.refreshLogsPanel()
	}
	system.post = function (origin, str) {
		const obj = {
			type: "post",
			origin: origin,
			content: system.cast.Stringify(str)
		}
		system.logs.push(obj)
		console.log(str)
		system.refreshLogsPanel()
	}

	system.warn = function (origin, str) {
		const obj = {
			type: "warn",
			origin: origin,
			content: (origin || Name) + ": " + system.cast.Stringify(str)
		}
		system.logs.push(obj)
		console.warn(str)
		system.refreshLogsPanel()
	}
	system.error = function (origin, str) {
		console.error(`Error in ${origin}:`)
		console.error(str)
		const obj = {
			type: "error",
			origin: origin,
			content: (origin || Name) + ": " + system.cast.Stringify(str)
		}
		system.logs.push(obj)
		system.refreshLogsPanel()
	}

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
	});

	document.addEventListener('keyup', (e) => {
		system.keys[e.key] = false
	})

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
		} catch (e) { }
		try {
			return (obj)
		} catch (e) { }
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

	system.setParam = function (name, value) {
		var s = new URLSearchParams(location.search);
		s.set(String(name), String(value));
		history.replaceState("", "", "?" + s.toString());
	}

	system.getParam = function (name) {
		return new URLSearchParams(location.search).get(String(name))
	}

	obj = checkIfCompatible()

	if (!obj.isCompatible) {
		system.error(Name, "Sorry, but your browser is not compatible with This System.")
		if (obj.showReason == undefined) obj.Showreason = obj.reason
		system.error(Name, 'Reason is your browser does not support <a href="https://developer.mozilla.org/en-US/docs/Web/API/' + obj.reason + '">' + obj.showReason + '</a>')
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

	system.asciiName = await system.fetchURL('./nameAscii.txt')
	document.getElementById("logoBox").innerHTML = system.asciiName

	// START FILESYSTEM
	system.fs = {} // foldersSet
	system.fs.directory = class directory {

		children = {}
		accessPerms = {}

		constructor(owner) {
			this.accessPerms[owner] = {
				read: true,
				write: true
			}
		}

		list() {
			return Object.keys(this.children)
		}

		writeFile(filename, contents) {
			let char = filename.lastIndexOf(".")
			const ext = filename.substring(char + 1)

			const File = new system.fs.file(ext, contents)
			this.children[filename] = File
		}

		deleteFile(filename) {
			delete this.children[filename]
		}

		createLink(filename, target) {
			const ln = new system.fs.link(target)

			this.children[filename] = ln
		}

		createAlias(filename, target) {
			this.createLink(filename, target)
			this.children[filename].type = "alias"
		}
	}

	system.fs.file = class file {
		constructor(ext, content) {
			if (ext == undefined || content == undefined) {
				throw new Error("extension and content MUST be defined when creating a file.")
			}

			const byteSize = str => new Blob([str]).size;

			this.type = `.${ext}`
			this.contents = content


			this.created = Date.now()
			this.edited = this.created
			this.accessPerms = {}


			this.size = byteSize(JSON.stringify(this))
			this.size = byteSize(JSON.stringify(this))
		}

		getAttribute(attribute) {
			return this[attribute]
		}

		updateContents(contents) {
			this.contents = contents
			this.edited = Date.now()
		}
	}


	system.fs.link = class link {
		constructor(target) {
			if (target == undefined) {
				throw new Error("target MUST be defined when creating a link.")
			}

			const byteSize = str => new Blob([str]).size;

			this.type = "dir"
			this.target = target

			this.created = Date.now()
			this.edited = this.created
			this.accessPerms = {}

			this.size = byteSize(JSON.stringify(this))
			this.size = byteSize(JSON.stringify(this))
		}
	}

	function getDirInfo(dirOld) {
		const obj = {}
		let dir = String(dirOld) // use to replace ~ with home dir in future
		let location = dir.substring(0, dir.lastIndexOf("/"))
		if (location == "") {
			location = "/"
		}
		obj.location = location
		obj.filename = dir.substring(dir.lastIndexOf("/") + 1)
		obj.ext = obj.filename.substring(obj.filename.lastIndexOf(".") + 1)
		obj.dir = dir
		return obj
	}

	function rawFile(directory) {
		const obj = getDirInfo(directory)
		return system.fs[obj.location].children[obj.filename]
	}

	system.fs.rawFile = rawFile

	// FILES!

	system.fs["/"] = new system.fs.directory()

	system.fs.writeFile = function (directory, content) {
		const obj = getDirInfo(directory)

		if (system.fs[obj.location].children[obj.filename] !== undefined) {
			const file = rawFile(directory)
			file.updateContents(content)
			return true
		}

		const file = new system.fs.file(obj.ext, content)
		system.fs[obj.location].children[obj.filename] = file
		return true
	}

	system.fs.readFile = function (directory, attribute) {
		try {
			const obj = getDirInfo(directory)

			const file = system.fs[obj.location].children[obj.filename]

			if (file == undefined) {
				return undefined
			}

			return file[attribute || "contents"]
		} catch (e) {
			console.warn("readFile: " + e + " reading " + directory)
			return undefined
		}
	}

	system.fs.deleteFile = function (directory) {
		try {
			const obj = getDirInfo(directory)

			delete system.fs[obj.location].children[obj.filename]

			return system.fs[obj.location].children[obj.filename] == undefined
		} catch (e) { }

		return undefined
	}
	
	// FOLDERS!

	system.fs.writeFolder = function (directory) {
		const obj = getDirInfo(directory)

		const link = new system.fs.link(obj.dir)
		const dir = new system.fs.directory()

		system.fs[obj.dir] = dir
		system.fs[obj.location].children[obj.filename] = link
	}

	system.fs.deleteFolder = function (directory) {
		const obj = getDirInfo(directory)

		const list = system.fs.rawFolder(directory).list()

		let direct = String(directory)

		if (direct.at(-1) !== "/") {
			direct += "/"
		}

		for (const i in list) {
			const dir = direct + list[i]

			if (system.fs.rawFile(dir).type == "dir") {
				system.fs.deleteFolder(dir)
			} else {
				system.fs.deleteFile(dir)
			}
		}

		delete system.fs[obj.location].children[obj.filename]
		delete system.fs[directory]
	}

	system.fs.rawFolder = function (directory) {
		return system.fs[directory]
	}

	system.fs.isFolder = function (directory) {
		try {
			if (directory == "/") return true

			const obj = getDirInfo(directory)

			const link = system.fs[obj.location].children[obj.filename]

			const type = link.type

			return type == "dir"
		} catch (e) {
			return false
		}
	}


	// run cryptography so we can actually write to files

	const crypt = await system.fetchURL(system.baseURI + '/boot/cryptography.js') // cryptoFetch
	eval(crypt)

	system.localFS = {}

	system.localFS.options = {
		startIn: 'documents',
		suggestedName: 'nordOS System.nordsys',
		types: [{
			description: "nordOS Disk Images",
			accept: {
				"text/plain": [".nordsys"],
			},
		},],
		excludeAcceptAllOption: true,
		multiple: false,
	};

	// function to write to file
	system.localFS.commit = async function () {
		// check we have a filehandle, if not get one
		if (system.fileHandle == undefined) {
			system.fileHandle = await window.showSaveFilePicker()
		}


		// create a FileSystemWritableFileStream to write to
		const writableStream = await system.fileHandle.createWritable();

		// build data to commit to file
		const data = {}
		data.fs = system.fs
		data.version = "v0.3.0"
		const writeData = JSON.stringify(data, null, 4)

		// write our file
		await writableStream.write(writeData);

		// close the file and write the contents to disk.
		await writableStream.close();
		console.log("Filesystem commited to hostOS")
	}

	if (!system.fsAPI) {
		system.localFS.commit = async function () { }
	}

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
	document.getElementById('preInput').innerText = "Select an option from above to boot nordOS."


	system.post("", "")
	const loop = setInterval(function () {
		if (system.progress) {
			try {
				bootOS(system.options[system.selection], system)
				document.removeEventListener('keydown', handle)
			} catch (e) {
				console.error(e)
				system.progress = false
			}
			clearInterval(loop)
			return
		} else {
			if (system.selection < 0) {
				system.selection = 0
			} else if (system.selection > system.options.length - 1) {
				system.selection = system.options.length - 1
			}
			const opt = JSON.parse(JSON.stringify(system.options))
			opt[system.selection] = "> " + opt[system.selection]

			system.logs[0].content = opt.join("\n")

			system.logsBox.innerText = system.logs[0].content
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
			const data = JSON.parse(text)

			switch (data.version) {
				case "v0.3.0":
					system.fs = {...system.fs, data.fs}
					break;
				default:
					throw new Error("Filesystem file not supported.")
			}


			// run kernel
			castoreaKernel = system.fs.readFile("/boot/kernel.js")
			break;
		case "new":
			if (system.fsAPI) {
				system.fileHandle = await window.showSaveFilePicker(system.localFS.options)
			}
			system.isNew = true

			// fetch kernel since it's not present yet to be ran
			system.fs.writeFolder("/boot")
			const kern = await system.fetchURL(system.baseURI + "/boot/castoreaKernel.js") // kernel download
			system.fs.writeFile("/boot/castoreaKernel.js", kern)
			castoreaKernel = system.fs.readFile("/boot/castoreaKernel.js")

			break;
		default:
			throw new Error("Unknown Case: " + osName)
	}
	castoreaKernel = new Function("ssm", castoreaKernel)
	castoreaKernel(system)

}

//try {
loader()
//} catch (e) {
//	console.error(e)
//document.getElementById("logsBox").innerText = e.stack
//}
