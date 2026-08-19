// UTILITIES

const VALID_DOCUMENT_STATUSES = ['For Review', 'Approved', 'Rejected']
const VALID_DOCUMENT_TYPES = ['pdf', 'txt', 'csv', 'md']

// #region _getDocumentLogsCollection
async function _getDocumentLogsCollection(libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	let collection
	try {
		collection = (await IafItemSvc.getNamedUserItems({
			query: { _userType: 'document-logs'}
		}, ctx))._list[0]
		console.info('Document Logs Collection:')
		console.info(JSON.stringify(collection))
	} catch (error) {
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Getting Document Logs Collection" }
	}

	if (!collection) {
		return { statusCode: 404, statusText: "Not Found", message: "Document Logs Collection Not Found" }
	}

	return collection

}
// #endregion

// #region getStatus
function getStatus(input, libraries, ctx) {

	console.info(JSON.stringify(input))
	return { statusCode: 200, statusText: "OK", message: "Sections API Available" }

}
// #endregion

// #region getDocumentStatuses
function getDocumentStatuses(input, libraries, ctx) {

	return { statusCode: 200, statusText: "OK", statuses: VALID_DOCUMENT_STATUSES }

}
// #endregion

// #region getDocumentVersions
async function getDocumentVersions(input, libraries, ctx) {

	const { IafFileSvc, IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.fileid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Fields: fileid" }
	}

	if (input.fileid.length == 0) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: fileid" }
	}

	const result = await IafFileSvc.getFileVersions(input.fileid, ctx)
	const documentLogsCollection = await _getDocumentLogsCollection(libraries, ctx)

	const versionsWithLogsAndUrls = await Promise.all(
		result._list.map(async (version) => {
			const [versionLogs, versionUrl] = await Promise.all([
				IafItemSvc.getRelatedItems(documentLogsCollection._userItemId, {
					query: { fileid: input.fileid, versionid: version._id }
				}, ctx, { sort: { "_metadata._createdAt": -1 }, page: { _pageSize: 200, _offset: 0 } }),
				IafFileSvc.getFileVersionUrl(version._fileId, version._id, ctx)
			])
			return { ...version, logs: versionLogs._list, _url: versionUrl._url }
		})
	)

	return { statusCode: 200, statusText: "OK", versions: versionsWithLogsAndUrls }

}
// #endregion

// #region setDocumentStatus
async function setDocumentStatus(input, libraries, ctx) {

	const { IafFileSvc, IafPassSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.fileid || !input.params.status) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Fields: fileid, status" }
	}

	if (input.fileid.length == 0 || input.params.status.length == 0) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: fileid, status" }
	}

	if (!VALID_DOCUMENT_STATUSES.includes(input.params.status)) {
		return { statusCode: 400, statusText: "Bad Request", message: "Invalid Status: " + input.params.status }
	}

	let existingFile = await IafFileSvc.getFile(input.fileid, ctx)
	console.log('Existing File:', JSON.stringify(existingFile))

	let updatedFile = {
		...existingFile,
		_tags: [`status:${input.params.status}`]
	}
	console.log('Updated File:', JSON.stringify(updatedFile))

	let updated = await IafFileSvc.updateFile(updatedFile._id, updatedFile, ctx)

	let user = await IafPassSvc.getCurrentUser(ctx)

	await createDocumentLog({
		fileid: input.fileid,
		versionid: updated._tipId,
		params: {
			status: input.params.status,
			message: input.params.message ? input.params.message : `Set status to ${input.params.status}`,
			note: input.params.note ? input.params.note : '',
			userid: user._id,
			username: `${user._firstname} ${user._lastname}`
		}
	}, libraries, ctx)

	return { statusCode: 200, statusText: "OK", message: "Document Status Set", document: updated }

}
// #endregion

// #region createDocumentLog
async function createDocumentLog(input, libraries, ctx) {

	console.info(JSON.stringify(input))

	if (!input.fileid || !input.versionid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Fields: fileid, versionid" }
	}

	if (input.fileid.length == 0 || input.versionid.length == 0) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: fileid, versionid" }
	}

	if (!input.params.status || !input.params.message || !input.params.userid || !input.params.username) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Fields: status, message, userid, username" }
	}

	if (input.params.status.length == 0 || input.params.message.length == 0 || input.params.userid.length == 0 || input.params.username.length == 0) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: status, message, userid, username" }
	}

	if (!VALID_DOCUMENT_STATUSES.includes(input.params.status)) {
		return { statusCode: 400, statusText: "Bad Request", message: "Invalid Status: " + input.params.status }
	}

	const documentLogsCollection = await _getDocumentLogsCollection(libraries, ctx)

	const documentLog = {
		fileid: input.fileid,
		versionid: input.versionid,
		status: input.params.status,
		message: input.params.message,
		userid: input.params.userid,
		username: input.params.username,
		note: input.params.note ? input.params.note : ''
	}

	let createdLog = await IafItemSvc.createRelatedItems(documentLogsCollection._userItemId, [documentLog], ctx)

	return { statusCode: 200, statusText: "OK", message: "Document Log Created", log: createdLog._list[0] }

}
// #endregion

// #region getDocumentLogs
async function getDocumentLogs(input, libraries, ctx) {

	console.info(JSON.stringify(input))


	if (!input.fileid || !input.versionid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Fields: fileid, versionid" }
	}

	if (input.fileid.length == 0 || input.versionid.length == 0) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: fileid, versionid" }
	}

	const documentLogsCollection = await _getDocumentLogsCollection(libraries, ctx)

	const logs = await IafItemSvc.getRelatedItems(documentLogsCollection._userItemId, {
		query: { fileid: input.fileid, versionid: input.versionid }
	}, ctx, { sort: { _createdAt: -1 }, page: { _pageSize: 200, _offset: 0 } })

	return { statusCode: 200, statusText: "OK", logs: logs._list }

}
// #endregion

// #region vectorizeDocumentVersion
async function vectorizeDocumentVersion(input, libraries, ctx) {

	const { IafAISvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.params.type || !VALID_DOCUMENT_TYPES.includes(input.params.type)) {
		return { statusCode: 400, statusText: "Bad Request", message: "Document Type not supported for vectorization" }
	}

	if (!input.fileid || !input.versionid || !input.params.name || !input.params.userType) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Fields: fileid, versionid, name, userType" }
	}

	if (input.fileid.length == 0 || input.versionid.length == 0 || input.params.name.length == 0 || input.params.userType.length == 0) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: fileid, versionid, name, userType" }
	}

	let existingKnowledgeBase = await IafAISvc.getKnowledgeBases({_userType: input.params.userType}, ctx)

	let vectorResult = null

	if (existingKnowledgeBase._list.length === 1) {
		try {
			await IafAISvc.deleteKnowledgeBase(existingKnowledgeBase._list[0]._id, ctx)
		} catch (error) {
			return { statusCode: 500, statusText: "Internal Server Error", message: "Error Deleting Vectorized Document", error: error }
		}
	}

	try {
		vectorResult = await IafAISvc.createKnowledgeBases({
			_name: input.params.name,
			_userType: input.params.userType,
			_fileId: input.fileid,
			_fileVersionId: input.versionid,
			_namespaces: ctx._namespaces
		}, ctx)
	} catch (error) {
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Creating Vectorized Document", error: error }
	}

	return { statusCode: 200, statusText: "OK", message: "Document Version Vectorized", vectorResult }

}
// #endregion

// #region trashDocument
async function trashDocument(input, libraries, ctx) {

	const { IafFileSvc, IafPassSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.fileid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Fields: fileid" }
	}

	let existingFile = await IafFileSvc.getFile(input.fileid, ctx)

	if (!existingFile) {
		return { statusCode: 404, statusText: "Not Found", message: "Document Not Found" }
	}

	let trashedFile = null
	if (!existingFile._tags.includes('trash')) {
		existingFile._tags.push('trash')
		trashedFile = await IafFileSvc.updateFile(input.fileid, existingFile, ctx)
	} else {
		trashedFile = existingFile
	}

	let user = await IafPassSvc.getCurrentUser(ctx)

	let log = {
		fileid: trashedFile._id,
		versionid: trashedFile._tipId,
		params: {
			status: trashedFile._tags.find(tag => tag.startsWith('status:')).split(':')[1],
			message: 'Document Moved to Trash',
			userid: user._id,
			username: `${user._firstname} ${user._lastname}`
		}
	}

	await createDocumentLog(log, libraries, ctx)

	return { statusCode: 200, statusText: "OK", message: "Document Trashed", document: trashedFile }

}
// #endregion

// #region untrashDocument
async function untrashDocument(input, libraries, ctx) {

	const { IafFileSvc, IafPassSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.fileid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Fields: fileid" }
	}

	let existingFile = await IafFileSvc.getFile(input.fileid, ctx)

	if (!existingFile) {
		return { statusCode: 404, statusText: "Not Found", message: "Document Not Found" }
	}

	let untrashedFile = null
	if (existingFile._tags.includes('trash')) {
		existingFile._tags.splice(existingFile._tags.indexOf('trash'), 1)
		untrashedFile = await IafFileSvc.updateFile(input.fileid, existingFile, ctx)
	} else {
		untrashedFile = existingFile
	}

	let user = await IafPassSvc.getCurrentUser(ctx)

	let log = {
		fileid: untrashedFile._id,
		versionid: untrashedFile._tipId,
		params: {
			status: untrashedFile._tags.find(tag => tag.startsWith('status:')).split(':')[1],
			message: 'Document Restored from Trash',
			userid: user._id,
			username: `${user._firstname} ${user._lastname}`
		}
	}

	await createDocumentLog(log, libraries, ctx)

	return { statusCode: 200, statusText: "OK", message: "Document Untrashed", document: untrashedFile }

}
// #endregion

// #region deleteDocument
async function deleteDocument(input, libraries, ctx) {

	const { IafFileSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.fileid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Fields: fileid" }
	}

	let existingFile = await IafFileSvc.getFile(input.fileid, ctx)

	if (!existingFile || !existingFile._tags.includes('trash')) {
		return { statusCode: 404, statusText: "Not Found", message: "Document Not Found in the Trash Bin" }
	}

	// delete the file
	await IafFileSvc.deleteFile(input.fileid, ctx)

	return { statusCode: 200, statusText: "OK", message: "Document Deleted" }
}
// #endregion

// #region getRunnableScripts
function getRunnableScripts() {

	return [

		{name: 'Get Status', script: 'getStatus'},
		{name: 'Create Document Log', script: 'createDocumentLog'},
		{name: 'Get Document Logs', script: 'getDocumentLogs'}

	]
}
// #endregion
