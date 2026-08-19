// #region _getLinksCollection
async function _getLinksCollection(libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	let collection
	try {
		collection = (await IafItemSvc.getNamedUserItems({
			query: { _userType: 'links'}
		}, ctx))._list[0]
		console.info('Links Collection:')
		console.info(JSON.stringify(collection))
	} catch (error) {
		return null
	}

	return collection

}
// #endregion

// #region _getSubsectionsCollection
async function _getSubsectionsCollection(libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	let collection
	try {
		collection = (await IafItemSvc.getNamedUserItems({
			query: { _userType: 'subsections'}
		}, ctx))._list[0]
		console.info('Subsections Collection:')
		console.info(JSON.stringify(collection))
	} catch (error) {
		return null
	}

	return collection

}
// #endregion

// #region _getSectionsCollection
async function _getSectionsCollection(libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	let collection
	try {
		collection = (await IafItemSvc.getNamedUserItems({
			query: { _userType: 'sections'}
		}, ctx))._list[0]
	} catch (error) {
		return null
	}

	return collection

}
// #endregion

// #region search
async function search(input, libraries, ctx) {

	const { IafFileSvc, IafItemSvc } = libraries.PlatformApi

	if ((!input.params.query || !input.params.query.length) && !input.params.trash) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: query" }
	}

	let links = []
	const linksCollection = await _getLinksCollection(libraries, ctx)
	if (linksCollection) {
	
		const _pageSize = 100
		let _offset = 0
		let _total = 0
	
		do {
	
			let linkPage = await IafItemSvc.getRelatedItems(linksCollection._userItemId, {
				query: {
					$and: [
						{$or: [
							{ name: { $regex: `.*${input.params.query}.*`, $options: 'i' } },
							{ description: { $regex: `.*${input.params.query}.*`, $options: 'i' } },
							{ url: { $regex: `.*${input.params.query}.*`, $options: 'i' } }
						]},
						{ $or: [{trash: false}, {trash: {$exists: false}}] }
					]
				}
			}, ctx, { page: { offset: _offset, limit: _pageSize } })
	
			links.push(...linkPage._list)
			_offset += _pageSize
			_total = linkPage._total
	
		} while (_offset < _total)
	}

	let files = []
	const subsectionsCollection = await _getSubsectionsCollection(libraries, ctx)

	if (subsectionsCollection) {
		const _filePageSize = 100
		let _fileOffset = 0
		let _fileTotal = 0
	
		do {
			let filePage = await IafFileSvc.getFiles({ _name: `.*${input.params.query}.*`, $options: 'i', _type: 'file'}, 
				ctx, { page: { _offset: _fileOffset, _pageSize: _filePageSize } }, true)
			files.push(...filePage._list.filter(file => !file._tags.includes('trash')))
			_fileOffset += _filePageSize
			_fileTotal = filePage._total
		} while (_fileOffset < _fileTotal)
	
		const uniqueDocParents = new Set()
	
		for (const doc of files) {
			if (Array.isArray(doc._parents)) {
				for (const parent of doc._parents) {
					uniqueDocParents.add(parent)
				}
			}
		}
	
		const flatUniqueParents = Array.from(uniqueDocParents)
	
		let subsectionInfo = []
		const _subsectionPageSize = 100
		let _subsectionOffset = 0
		let _subsectionTotal = 0
	
		do {
			let subsectionPage = await IafItemSvc.getRelatedItems(subsectionsCollection._userItemId, {
				query: { folderId: {$in: flatUniqueParents} }
			}, ctx, { page: { _offset: _subsectionOffset, _pageSize: _subsectionPageSize } })
	
			subsectionInfo.push(...subsectionPage._list)
			_subsectionOffset += _subsectionPageSize
			_subsectionTotal = subsectionPage._total
	
		} while (_subsectionOffset < _subsectionTotal)
	
		files.forEach(file => {
			file.subsectionId = subsectionInfo.find(subsection => subsection.folderId === file._parents[0])?._id
			file.sectionId = subsectionInfo.find(subsection => subsection.folderId === file._parents[0])?.sectionId
		})
	}
	
	return { statusCode: 200, statusText: "OK", message: "Search Results", searchResults: { links, documents: files } }

}
// #endregion

// #region searchTrash
async function searchTrash(input, libraries, ctx) {

	const { IafFileSvc, IafItemSvc } = libraries.PlatformApi

	let links = []
	let documents = []
	let sections = []
	let subsections = []

	const sectionsCollection = await _getSectionsCollection(libraries, ctx)
	if (sectionsCollection) {
		const _pageSize = 100
		let _offset = 0
		let _total = 0

		do {
			let sectionPage = await IafItemSvc.getRelatedItems(sectionsCollection._userItemId, {
				query: { trash: true }
			}, ctx, { page: { offset: _offset, limit: _pageSize } })
			sections.push(...sectionPage._list)
			_offset += _pageSize
			_total = sectionPage._total
		} while (_offset < _total)
	}

	const subsectionsCollection = await _getSubsectionsCollection(libraries, ctx)
	if (subsectionsCollection) {
		const _pageSize = 100
		let _offset = 0
		let _total = 0

		do {
			let subsectionPage = await IafItemSvc.getRelatedItems(subsectionsCollection._userItemId, {
				query: { trash: true }
			}, ctx, { page: { offset: _offset, limit: _pageSize } })
			subsections.push(...subsectionPage._list)
			_offset += _pageSize
			_total = subsectionPage._total
		} while (_offset < _total)
	}

	const linksCollection = await _getLinksCollection(libraries, ctx)
	if (linksCollection) {
	
		const _pageSize = 100
		let _offset = 0
		let _total = 0
	
		do {
	
			let linkPage = await IafItemSvc.getRelatedItems(linksCollection._userItemId, {
				query: { trash: true }
			}, ctx, { page: { offset: _offset, limit: _pageSize } })
	
			links.push(...linkPage._list)
			_offset += _pageSize
			_total = linkPage._total
	
		} while (_offset < _total)
	}

	const _filePageSize = 100
	let _fileOffset = 0
	let _fileTotal = 0

	do {
		let filePage = await IafFileSvc.getFiles({ _tags: 'trash' }, 
			ctx, { page: { _offset: _fileOffset, _pageSize: _filePageSize } }, true)
		documents.push(...filePage._list)
		_fileOffset += _filePageSize
		_fileTotal = filePage._total
	} while (_fileOffset < _fileTotal)


	return { statusCode: 200, statusText: "OK", message: "Search Results", searchResults: { sections, subsections, documents, links } }
}
// #endregion
