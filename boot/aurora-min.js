// Aurora Package Manager for nordOS

async function init(arguements) {
	try {
		system
	} catch (e) {
		console.warn("Aurora needs sudo to run!")
		return
	}

	system.isInstalling = true
	system.versions.aurora = "apmv0.1.1"

	//csw.versions.registerApp("apmv0.1.1")
	local.aurora = system.fs.readFile("/usr/bin/aurora/state.json")

	if (local.aurora == undefined) {
		local.aurora = {}
		local.aurora.directory = "/usr/bin/aurora"

		// set state
		local.aurora.index = {}
		local.aurora.sources = {}
	}
	local.aurora.version = "v0.2.2"

	if (system.fs.rawFolder(local.aurora.directory) == undefined) {
		system.fs.writeFolder(local.aurora.directory)
	}


	local.index = local.aurora.index
	local.sources = local.aurora.sources
	const index = local.index

	const args = []
	const flags = []

	// check for flag parameters, and make sure they are in a seperate array
	for (const i in arguements) {
		if (arguements[i][0] == "-") {
			flags.push(arguements[i])
		} else {
			args.push(arguements[i])
		}
	}



	let data
	let file
	local.id1 = undefined
	local.id2 = undefined
	let keys

	function editLogs(first, second, patchType) {
		try {
			if (local.isSilent) {
				return
			}

			if (local.id1 == undefined) {
				local.id1 = console.post(first)
			}

			if (local.id2 == undefined) {
				local.id2 = console.post(second)
			}

			console.edit(first, local.id1, patchType)
			console.edit(second, local.id2, patchType)
		} catch (e) { }
	}

	local.isSilent = flags.includes("-s")

	switch (args[0]) {
		case "source":

			if (args[2] !== "as" || args[3] == undefined) {
				console.post("You must source to as a term.")
				return
			}

			if (args[1].at(-1) !== "/") {
				args[1] += "/"
			}

			local.sources[args[3]] = args[1]
			break;
		case "install":

			if (typeof args[1] == "object") {
				for (const i in args[1]) {
					await init(["install", args[1][i]])
				}
				return
			}

			const dotPoint = args[1].indexOf(".")
			let base = args[1].substring(0, dotPoint)
			if ([undefined, "", null].includes(base)) {
				base = "default"
			}
			let packageName = args[1].substring(dotPoint + 1, Infinity)
			const url = local.aurora.sources[base]

			editLogs(`install of ${args[1]} 0% completed`, `--------------------`)

			// download the package info
			data = await system.fetchURL(url + packageName + "/info.json")

			editLogs(`install of ${args[1]} 50% completed`, `##########----------`)

			// parse it, and if it's invalid, catch and tell the user the package either doesn't exist OR is formatted wrong
			try {
				data = JSON.parse(data)
			} catch (e) {
				if (e == 'SyntaxError: "undefined" is not valid JSON') {
					editLogs("installation of " + args[1] + " has failed because the package does not exist.", "", "error")
				} else {
					editLogs("installation of " + args[1] + " has failed because the package info is invalid: " + e, "", "error")
				}
				break;
			}

			// install dependencies
			for (const i in data.dependencies) {
				system.startProcess("/bin/aurora.js", ["install", data.dependencies[i]], true)
			}

			for (const i in data.directories) {
				system.fs.writeFolder(data.directories[i])
			}

			// download other files the package needs
			const files = Object.keys(data.files || {})
			for (const i in files) {
				const file = files[i]
				const uri = url + args[1] + file

				// download
				const content = await system.fetchURL(uri)
				const dir = data.files[file]
				system.fs.writeFile(dir, content)
			}

			index[args[1]] = data


			if (data.lang == undefined) {
				data.lang = ""
			} else {
				data.lang = "." + data.lang
			}

			// download the file
			file = await system.fetchURL(url + packageName + "/src" + data.lang)

			if (data.directory !== undefined) {
				// write the file to it's specific directory
				// I intend to require elevated permissions for this in future
				system.fs.writeFile(data.directory + "/" + data.name + data.lang, file)
			} else {
				// write the file
				system.fs.writeFile(local.aurora.directory + "/" + data.name + data.lang, file)
			}

			editLogs("installation of " + args[1] + " 100% completed", `####################`)

			break;
		case "uninstall":
			data = index[args[1]]
			const dir = `${data.directory}/${args[1]}${data.lang}`

			system.fs.deleteFile(dir)
			delete index[args[1]]
			break;
		case "info":
			keys = Object.keys(aurora)
			for (const i in keys) {
				console.post("   " + keys[i] + ": " + aurora[keys[i]])
			}
			break;
		case "list":
			console.log(index)
			keys = Object.keys(index)
			for (const i in keys) {
				console.post("  -  " + keys[i])
			}
			break;
		case undefined:
		case "":
			console.post("Example Usage:")
			console.post("   - aurora install [package-name]")
			console.post("   - aurora uninstall [package-name]")
			console.post("   - aurora list")
			console.post("   - aurora info")
			console.post("")
			console.post("   - aurora -s:     runs aurora silently")
			break;
		default:
			console.error("Error: Unknown command: aurora " + args[0])
	}

	system.fs.writeFile(local.aurora.directory + "/state.json", local.aurora)
	system.isInstalling = false
}