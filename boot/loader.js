// bootloader for Constellation / Constellation Based Systems.

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

	system.safe = true
	system.forceSystemLog = true
	system.maxPID = 0

	system.inputText = ""
	system.versions = {
		loader: "v0.3.0"
	}
	system.logsBox = document.getElementById("logsBox")
	system.logs = []

	document.body.click() // so that things that need user interaction can run

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
			if (typeof system.fs.readFile("/proc")[system.logsFocus] !== "object") {
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

	system.log = function (origin = Name, str) {
		const obj = {
			type: "log",
			origin: origin,
			content: origin + ": " + system.cast.Stringify(str)
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

	system.warn = function (origin = Name, str) {
		const obj = {
			type: "warn",
			origin: origin,
			content: origin + ": " + system.cast.Stringify(str)
		}
		system.logs.push(obj)
		console.warn(str)
		system.refreshLogsPanel()
	}
	system.error = function (origin = Name, str) {
		console.error(`Error in ${origin}:`)
		console.error(str)
		const obj = {
			type: "error",
			origin: origin,
			content: origin + ": " + system.cast.Stringify(str)
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

		return res.substring(res.indexOf(after) + after.length)
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
	system.fastBoot = Boolean(system.getParam("fastBoot"))

	if (system.development) {
		window.sse = system // security be damned
	}

	if (system.fastBoot) {
		system.fsAPI = false // so I don't have to constantly make a new system to update it
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


















	// Processes (for the VFS system)
	const proc = {
		PID: -1,
		parent: -1,
		children: [],
		name: "/boot/castoreaKernel.js",
		isUnsafe: true,
		args: [],
		token: {
			user: "root"
		},
		variables: {
			shared: {
				log: system.log,
				warn: system.warn,
				error: system.error,
				post: system.post,
				editLog: system.editLog
			},
			fs: {}
		}
	}

	//system.fs["/"].children.proc.contents = {}
	//const processes = system.fs.readFile("/proc")
	system.processes = {}
	const processes = system.processes

	processes[PID] = proc




















	// START FILESYSTEM
	system.fs = {}
	system.kernelVFS = system.processes[-1].variables.fs
	system.vfs = {}
	system.vfsMan = {}

	system.fsErrors = []
	system.fs.directory = (permissions = {
		"owner": {
			"user": "root",
			"read": true,
			"write": true,
			"execute": true
		},
		"group": {
			"group": "root",
			"read": true,
			"write": true,
			"execute": false
		},
		"others": {
			"read": true,
			"write": false,
			"execute": false
		}
	}) => {

		const obj = {
			permissions: permissions,
			children: {}
		}

		return obj
	}

	system.fs.file = (ext, content, safeMode) => {

		if (ext == undefined || content == undefined) {
			throw new Error("extension and content MUST be defined when creating a file.")
		}

		const byteSize = str => new Blob([str]).size;

		const obj = {
			type: `.${ext}`,
			contents: content,
			created: Date.now(),
			edited: Date.now()
		}

		if (!safeMode) {
			obj.size = byteSize(JSON.stringify(obj))
			obj.size = byteSize(JSON.stringify(obj))
		}

		return obj
	}


	system.fs.link = (target) => {
		if (target == undefined) {
			throw new Error("target MUST be defined when creating a link.")
		}

		const byteSize = str => new Blob([str]).size;

		const obj = {
			type: "dir",
			target: target,
			created: Date.now(),
			edited: Date.now()
		}

		obj.size = byteSize(JSON.stringify(obj))
		obj.size = byteSize(JSON.stringify(obj))

		return obj
	}

	function longestStringInArray(input) {
		try {
			return input.reduce((a, b) => a.length <= b.length ? b : a)
		} catch (e) {
			console.debug(input)
			throw e
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

		const vfs = []
		const ssmvfs = system.vfs

		for (const i in ssmvfs) {
			if (dirOld.startsWith(i)) {
				vfs.push(i)
			}
		}

		obj.vfs = longestStringInArray(vfs)

		obj.vfsInf = system.vfs[obj.vfs]

		return obj
	}

	system.vfsMan.rawFile = (directory, fs) => {
		const obj = getDirInfo(directory)
		return fs[obj.location].children[obj.filename]
	}

	function permissionsCheck(directory, username, permission, rootOverride = true, fs) {
		const obj = getDirInfo(directory)

		try {
			if (fs[obj.location].children[obj.filename] == undefined) {
				return false
			}
		} catch (e) {
			return false
		}

		if (username == "root" && rootOverride) {
			// root is genuinely god here
		} else {
			const permissions = system.fs.folderPermissions(obj.location)
			let key = "others"
			if (permissions.owner.user == username) {
				key = "owner"
			}

			const access = permissions[key][permission]
			if (access !== true) {
				throw system.fs.errors.noPermission(username)
			}
		}
	}

	// FILES!

	system.vfsMan.writeFile = function (directory, content, username = "root", fs) {
		try {

			const obj = getDirInfo(directory)

			if (fs[obj.location] == undefined) {
				throw new Error(`Parent directory ${obj.location} does not exist.`)
			}

			if (fs[obj.location].children[obj.filename] !== undefined) {

				permissionsCheck(directory, username, "write", true, fs)

				const file = system.vfsMan.rawFile(directory)
				file.contents = content
				return {
					result: true
				}
			}

			const file = system.fs.file(obj.ext, content)
			fs[obj.location].children[obj.filename] = file
			return {
				result: true,
			}
		} catch (e) {
			system.fsErrors.push({
				origin: "writeFile",
				error: e
			})
			return {
				result: false,
				error: e
			}
		}
	}

	system.vfsMan.readFile = function (directory, attribute = "contents", username = "root", fs) {

		const obj = getDirInfo(directory)

		try {
			if (fs[obj.location].children[obj.filename] == undefined) {
				return undefined
			}
		} catch (e) {
			return undefined
		}

		if (attribute !== "permissions") {
			permissionsCheck(directory, username, "read", true, fs)
		}

		try {
			const file = fs[obj.location].children[obj.filename]

			if (file == undefined) {
				return undefined
			}

			return file[attribute]
		} catch (e) {
			if (String(e).startsWith("TypeError: Cannot read properties of undefined")) {
				return undefined
			}
			console.warn("readFile: " + e + " reading " + directory)
			return undefined
		}
	}

	system.vfsMan.deleteFile = function (directory, username = "root", fs) {

		const obj = getDirInfo(directory)

		try {
			if (fs[obj.location].children[obj.filename] == undefined) {
				return undefined
			}
		} catch (e) {
			return undefined
		}

		permissionsCheck(directory, username, "write", true, fs)

		try {
			delete fs[obj.location].children[obj.filename]

			return fs[obj.location].children[obj.filename] == undefined
		} catch (e) {
			return {
				result: false,
				error: e
			}
		}
	}

	// FOLDERS!

	system.vfsMan.writeFolder = function (directory, usr = "root", fs) {

		if (fs[directory] !== undefined) {
			return {
				result: true,
				reason: "Directory already exists!"
			}
		}

		const obj = getDirInfo(directory)

		if (fs[obj.location] == undefined) {
			throw system.fs.errors.parentNotReal(directory)
		}

		let username = usr

		if (username == undefined) {
			username = fs[obj.location].permissions.owner.user
		}

		permissionsCheck(directory, username, "write", true, fs)

		try {
			const link = system.fs.link(obj.dir)
			const dir = system.fs.directory()

			fs[obj.dir] = dir
			fs[obj.location].children[obj.filename] = link
			return {
				result: true
			}
		} catch (e) {
			system.fsErrors.push({
				origin: "writeFolder",
				error: e
			})
			return {
				result: false,
				error: e
			}
		}
	}

	system.vfsMan.listFolder = function (directory, username = "root", fs) {
		if (fs[directory] == undefined) {
			console.debug(fs)
			throw new Error(`Directory '${directory}' does not exist.`)
		}


		permissionsCheck(directory, username, "read", true, fs)

		try {
			return Object.keys(system.vfsMan.rawFolder(directory, fs).children)
		} catch (e) {
			return {
				result: false,
				error: e
			}
		}
	}

	system.vfsMan.deleteFolder = function (directory, username = "root", fs) {

		if (fs[directory] == undefined) {
			throw new Error(`Directory ${directory} does not exist.`)
		}

		permissionsCheck(directory, username, "write", true, fs)

		try {
			const obj = getDirInfo(directory)

			const list = system.vfsMan.listFolder

			if (list.length !== 0) {
				return {
					result: false,
					reason: "Directory is not empty."
				}
			}

			let direct = String(directory)

			if (direct.at(-1) !== "/") {
				direct += "/"
			}

			delete fs[obj.location].children[obj.filename]
			delete fs[directory]
			return {
				result: true
			}
		} catch (e) {
			return {
				result: false,
				error: e
			}
		}
	}

	system.vfsMan.folderPermissions = function (directory, fs) {
		try {
			if (directory == "/") {
				return system.vfsMan.rawFolder("/", fs).permissions
			}

			let perms = system.vfsMan.rawFolder(directory, fs).permissions
			return perms
		} catch (e) {
			system.fsErrors.push({
				origin: "folderPermissions",
				error: e,
				args: [
					directory
				]
			})
			return undefined
		}
	}

	system.vfsMan.rawFolder = function (directory, fs) {
		return fs[directory]
	}

	system.vfsMan.isFolder = function (directory, fs) {
		try {
			if (directory == "/") return true

			const obj = getDirInfo(directory)

			const link = fs[obj.location].children[obj.filename]

			const type = link.type

			return type == "dir"
		} catch (e) {
			return false
		}
	}

	system.vfsMan.exists = function (directory, fs) {
		const obj = getDirInfo(directory)

		try {
			return fs[directory] !== undefined
		} catch (e) {
			return false
		}
	}

	// newFS

	const getVFS = (directory) => {
		try {
			const obj = getDirInfo(directory)

			const vfsInf = obj.vfsInf

			const process = processes[vfsInf.PID]

			const vfs = process.variables[vfsInf.KEY]
			let vfsDir = directory.textAfter(obj.vfs)

			if (vfsDir[0] !== "/") {
				vfsDir = "/" + vfsDir
			}

			if (directory.substring(0, 9) == "/mnt/usb0") {
				console.debug(obj.vfsInf)
			}

			return {
				vfs: vfs,
				vfsDir: vfsDir
			}
		} catch (e) {
			return {
				vfs: undefined,
				vfsDir: "/"
			}
		}
	}
	system.fs.getVFS = getVFS

	// File operations
	system.fs.readFile = (directory, attribute = "contents", username = "root") => {
		const obj = getVFS(directory)
		return system.vfsMan.readFile(obj.vfsDir, attribute, username, obj.vfs)
	}

	system.fs.writeFile = (directory, content, username = "root") => {
		const obj = getVFS(directory)
		return system.vfsMan.writeFile(obj.vfsDir, content, username, obj.vfs)
	}

	system.fs.deleteFile = (directory, username = "root") => {
		const obj = getVFS(directory)
		return system.vfsMan.deleteFile(obj.vfsDir, username, obj.vfs)
	}


	// Folder operations
	system.fs.listFolder = (directory, username = "root") => {
		const obj = getVFS(directory)
		return system.vfsMan.listFolder(obj.vfsDir, username, obj.vfs)
	}

	system.fs.writeFolder = (directory, username = "root") => {
		const obj = getVFS(directory)
		return system.vfsMan.writeFolder(obj.vfsDir, username, obj.vfs)
	}

	system.fs.deleteFolder = (directory, username = "root") => {
		const obj = getVFS(directory)
		return system.vfsMan.deleteFolder(obj.vfsDir, username, obj.vfs)
	}

	system.fs.rawFolder = (directory) => {
		const obj = getVFS(directory)
		return system.vfsMan.rawFolder(obj.vfsDir, obj.vfs)
	}

	system.fs.isFolder = (directory) => {
		const obj = getVFS(directory)
		return system.vfsMan.isFolder(obj.vfsDir, obj.vfs)
	}

	system.fs.folderPermissions = (directory) => {
		const obj = getVFS(directory)
		return system.vfsMan.folderPermissions(obj.vfsDir, obj.vfs)
	}


	// Typeless operations (files AND folderes)
	system.fs.exists = (directory) => {
		const obj = getVFS(directory)
		return system.vfsMan.exists(obj.vfsDir, obj.vfs)
	}

	system.newVFS = (PID, directory, keyname = "fs", link = true) => {

		console.log(`VFS in ${directory} has been created and mounted.`)

		if (link == true) {
			const vfs = getVFS(directory)
			const obj = getDirInfo(directory)

			const link = system.fs.link(obj.dir)

			vfs.vfs[obj.location].children[obj.filename] = link
		}

		system.vfs[directory] = {
			PID: PID,
			KEY: keyname
		}

		return {
			"/": system.fs.directory()
		}
	}

	system.delVFS = (directory, link = true) => {
		const vfsInfo = system.vfs[directory]

		if (link) {
			const vfs = getVFS(directory)

			const obj = getDirInfo(directory)

			delete vfs.vfs[obj.location].children[obj.filename]
		}

		system.stopProcess(vfsInfo.PID)

		delete system.vfs[directory]
	}

	// REMOVE! // why? this is how the filesystem gets created? I think we need the filesystem.
	system.processes[-1].variables.fs = system.newVFS(-1, "/", "fs", false)

	// temp directory
	system.processes[-1].variables.tmp = system.newVFS(-1, "/tmp", "tmp", true)

	// FILESYSTEM ERRORS

	system.fs.errors = {}
	system.fs.errors.noPermission = function (username) {
		return new Error(`Access Denied; User ${username} does not have access to this file.`)
	}
	system.fs.errors.parentNotReal = function (directory) {
		return new Error(`Operation Failed: Parent directory of ${directory} does not exist.`)
	}



















	// run cryptography so we can do user login stuff

	const crypt = await system.fetchURL(system.baseURI + '/boot/cryptography.js') // cryptoFetch
	eval(crypt)

	system.localFS = {}

	system.localFS.options = {
		startIn: 'documents',
		suggestedName: 'Constellation System.cfsv2',
		types: [{
			description: "Constellation File System (v2)",
			accept: {
				"text/plain": [".cfsv2"],
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
		data.fs = system.processes[-1].variables.fs
		data.version = "v0.4.0"
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
	document.getElementById('preInput').innerText = "Select an option from above to boot Constellation."


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

	console.debug("Loading Filesystem...")

	const system = ssm;
	// delete bootloader keys
	delete system.progress;
	delete system.selection;
	delete system.options;
	let castoreaKernel;

	switch (String(osName).toLowerCase()) {
		case "open":
			// open file picker
			[system.fileHandle] = await window.showOpenFilePicker(system.localFS.options);
			const fileData = await system.fileHandle.getFile();

			// extract the text of the file
			const text = await fileData.text();
			const data = JSON.parse(text);

			const errors = system.fs.errors

			switch (data.version) {
				case "v0.3.0":
					system.processes[-1].variables.fs = data.fs
					break;
				case "v0.4.0":
					system.processes[-1].variables.fs = data.fs
					break;
				default:
					throw new Error("Filesystem file not supported.");
			}

			system.fs.errors = errors


			// run kernel
			castoreaKernel = system.fs.readFile("/boot/castoreaKernel.js");
			break;
		case "new":
			if (system.fsAPI) {
				system.fileHandle = await window.showSaveFilePicker(system.localFS.options);
			}
			system.isNew = true;

			// fetch kernel since it's not present yet to be ran
			system.fs.writeFolder("/boot");
			const kern = await system.fetchURL(system.baseURI + "/boot/castoreaKernel.js"); // kernel download
			system.fs.writeFile("/boot/castoreaKernel.js", kern);
			castoreaKernel = system.fs.readFile("/boot/castoreaKernel.js");

			break;
		default:
			throw new Error("Unknown Case: " + osName);
	}

	if (castoreaKernel == undefined) {
		console.debug(castoreaKernel)
		throw new Error("This instance does not contain a valid kernel.")
	}

	console.debug("Running Kernel")

	castoreaKernel = new Function("ssm", castoreaKernel);
	castoreaKernel(system);
}

try {
	loader()
} catch (e) {
	console.error(e)
	document.getElementById("display").innerHTML = e.stack
}