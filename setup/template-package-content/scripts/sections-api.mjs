// UTILITIES
const VALID_DOCUMENT_STATUSES = ['For Review', 'Approved', 'Rejected']

// #region _getSectionsCollection
async function _getSectionsCollection(libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	let collection
	try {
		collection = (await IafItemSvc.getNamedUserItems({
			query: { _userType: 'sections' }
		}, ctx))._list[0]
		console.info('Sections Collection:')
		console.info(JSON.stringify(collection))
	} catch (error) {
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Getting Sections Collection" }
	}

	if (!collection) {
		return { statusCode: 404, statusText: "Not Found", message: "Sections Collection Not Found" }
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
			query: { _userType: 'subsections' }
		}, ctx))._list[0]
		console.info('Subsections Collection:')
		console.info(JSON.stringify(collection))
	} catch (error) {
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Getting Subsections Collection" }
	}

	if (!collection) {
		return { statusCode: 404, statusText: "Not Found", message: "Subsections Collection Not Found" }
	}

	return collection

}
// #endregion

// #region _getLinksCollection
async function _getLinksCollection(libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	let collection
	try {
		collection = (await IafItemSvc.getNamedUserItems({
			query: { _userType: 'links' }
		}, ctx))._list[0]
		console.info('Links Collection:')
		console.info(JSON.stringify(collection))
	} catch (error) {
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Getting Links Collection" }
	}

	if (!collection) {
		return { statusCode: 404, statusText: "Not Found", message: "Links Collection Not Found" }
	}

	return collection

}
// #endregion

// #region _getLinkLogsCollection
async function _getLinkLogsCollection(libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	let collection
	try {
		collection = (await IafItemSvc.getNamedUserItems({
			query: { _userType: 'link-logs' }
		}, ctx))._list[0]
	} catch (error) {
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Getting Link Logs Collection" }
	}

	if (!collection) {
		return { statusCode: 404, statusText: "Not Found", message: "Link Logs Collection Not Found" }
	}

	return collection

}
// #endregion

// #region _createSectionUserGroups
async function _createSectionUserGroups(section, libraries, ctx) {

	const { IafPassSvc, IafFileSvc } = libraries.PlatformApi

	const projectReq = await IafPassSvc.getWorkspaces({ _namespaces: ctx._namespaces }, ctx, { _pageSize: 1000 })
	const project = projectReq._list.find(p => p._namespaces.includes(ctx._namespaces[0]))

	console.log('project:')
	console.log(JSON.stringify(project))

	if (!project) {
		return { statusCode: 500, statusText: "Internal Server Error", message: "Project Not Found" }
	}

	// only the room admin user group is added to the project user attributes
	let adminGroup = await IafPassSvc.getUserGroup(project._userAttributes?.user_group[0], ctx)
	console.info('Room Admin Group:')
	console.info(JSON.stringify(adminGroup))

	if (!adminGroup) {
		return { statusCode: 500, statusText: "Internal Server Error", message: "Room Admin Group Not Found" }
	}

	let sectionAdminGroupDef = {
		_name: `Section Admin`,
		_description: "User group for Section Admins",
		_shortName: "sectionadmin",
		_userAttributes: {
			section: section._id,
			project_workspace: {
				_id: project._id,
				_namespaces: project._namespaces
			}
		}
	}
	let sectionContributorGroupDef = {
		_name: `Section Contributor`,
		_description: "User group for Section Contributors",
		_shortName: "sectioncont",
		_userAttributes: {
			section: section._id,
			project_workspace: {
				_id: project._id,
				_namespaces: project._namespaces
			}
		}
	}
	let sectionViewerGroupDef = {
		_name: `Section Viewer`,
		_description: "User group for Section Viewers",
		_shortName: "sectionview",
		_userAttributes: {
			section: section._id,
			project_workspace: {
				_id: project._id,
				_namespaces: project._namespaces
			}
		}
	}
	console.info('Section User Groups Definitions:')
	console.info(JSON.stringify(sectionAdminGroupDef))
	console.info(JSON.stringify(sectionContributorGroupDef))
	console.info(JSON.stringify(sectionViewerGroupDef))

	let sectionAdminGroup, sectionContributorGroup, sectionViewerGroup
	try {
		let sectionGroups = await IafPassSvc.createUserGroups([sectionAdminGroupDef, sectionContributorGroupDef, sectionViewerGroupDef], ctx)
		console.info('Section User Groups:')
		console.info(JSON.stringify(sectionGroups))
		sectionGroups._list.forEach(group => {
			if (group._name === 'Section Admin') {
				sectionAdminGroup = group
			} else if (group._name === 'Section Contributor') {
				sectionContributorGroup = group
			} else if (group._name === 'Section Viewer') {
				sectionViewerGroup = group
			}
		})
	} catch (error) {
		console.error('Error Creating Section User Groups:')
		console.error(error)
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Creating Section User Groups" }
	}

	// give Room Admin access to Section groups
	let roomAdminUGPerms = [sectionAdminGroup, sectionContributorGroup, sectionViewerGroup].map(group => {
		return {
			"_namespace": group._namespaces[0],
			"_actions": [
				"*"
			],
			"_resourceDesc": {
				"_irn": `passportsvc:usergroup:${group._id}`
			},
			"_user": {
				"_id": adminGroup._id,
				"_type": "usergroup"
			}
		}
	})

	// give section groups access to read workspaces
	let sectionWorkspacePerms = [sectionAdminGroup, sectionContributorGroup, sectionViewerGroup].map(group => {
		return {
			_namespace: ctx._namespaces[0],
			_actions: [
				"READ"
			],
			_resourceDesc: {
				_irn: "passportsvc:workspace:*"
			},
			_user: {
				_id: group._id,
				_type: "usergroup"
			}
		}
	})

	try {
		let passRes = await IafPassSvc.createPermissions([...roomAdminUGPerms, ...sectionWorkspacePerms], ctx)
		console.info('Pass Permissions Result:')
		console.info(JSON.stringify(passRes))
	} catch (error) {
		console.error('Error Giving Room Admin Access to Section Groups:')
		console.log(error)
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Giving Room Admin Access to Section Groups" }
	}

	// Create file service permissions for section groups

	let sectionsFileServicePerms = [sectionAdminGroup, sectionContributorGroup, sectionViewerGroup].map(group => {
		if (group._name === 'Section Admin') {
			return {
				_namespace: ctx._namespaces[0],
				_actions: [
					"*"
				],
				_resourceDesc: {
					_irn: `filesvc:file:${section.folderId}`
				},
				_user: {
					_id: group._id,
					_type: "usergroup"
				}
			}
		} else if (group._name === 'Section Contributor') {
			return {
				_namespace: ctx._namespaces[0],
				_actions: [
					"READ", "CREATE", "EDIT"
				],
				_resourceDesc: {
					_irn: `filesvc:file:${section.folderId}`
				},
				_user: {
					_id: group._id,
					_type: "usergroup"
				}
			}
		} else if (group._name === 'Section Viewer') {
			return {
				_namespace: ctx._namespaces[0],
				_actions: [
					"READ"
				],
				_resourceDesc: {
					_irn: `filesvc:file:${section.folderId}`
				},
				_user: {
					_id: group._id,
					_type: "usergroup"
				}
			}
		}
	})

	console.info('Section File Service Permissions:')
	console.info(JSON.stringify(sectionsFileServicePerms))

	try {
		let fileRes = await IafFileSvc.createPermissions(sectionsFileServicePerms, ctx)
		console.info('File Service Permissions Result:')
		console.info(JSON.stringify(fileRes))
	} catch (error) {
		console.error('Error Creating Section File Service Permissions:')
		console.log(error)
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Creating Section File Service Permissions", error }
	}

	// create item service permissions for section groups

	let sectionCollection = await _getSectionsCollection(libraries, ctx)
	let subsectionCollection = await _getSubsectionsCollection(libraries, ctx)
	let linkCollection = await _getLinksCollection(libraries, ctx)

	let sectionItemServicePerms = [sectionAdminGroup, sectionContributorGroup, sectionViewerGroup].map(group => {

		// all groups get read to scripts and sections collection
		let perms = [{
			_actions: ["READ"],
			_namespace: ctx._namespaces[0],
			_resourceDesc: {
				_irn: 'itemsvc:nameduseritem:*',
				_criteria: {
					_itemClass: "Script"
				}
			},
			_user: {
				_id: group._id,
				_type: 'usergroup'
			}
		}, {
			_actions: ["READ"],
			_namespace: ctx._namespaces[0],
			_resourceDesc: {
				_irn: `itemsvc:nameduseritem:${sectionCollection._id}`,
				_subresourceDesc: {
					_type: 'relateditem',
					_criteria: {
						_id: section._id
					}
				}
			},
			_user: {
				_id: group._id,
				_type: 'usergroup'
			}
		}, {
			_actions: ["READ"],
			_namespace: ctx._namespaces[0],
			_resourceDesc: {
				_irn: 'itemsvc:nameduseritem:*',
				_criteria: {
					_itemClass: "NamedFileCollection",
				}
			},
			_user: {
				_id: group._id,
				_type: 'usergroup'
			}
		}]

		if (group._name === 'Section Admin') {

			perms.push({
				_actions: ["CREATE"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: `itemsvc:nameduseritem:${subsectionCollection._id}`,
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["READ", "EDIT"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: `itemsvc:nameduseritem:${subsectionCollection._id}`,
					_subresourceDesc: {
						_type: 'relateditem',
						_criteria: {
							sectionId: section._id
						}
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["CREATE"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: `itemsvc:nameduseritem:${linkCollection._id}`,
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["READ", "EDIT"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: `itemsvc:nameduseritem:${linkCollection._id}`,
					_subresourceDesc: {
						_type: 'relateditem',
						_criteria: {
							sectionId: section._id
						}
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["READ", "CREATE"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: 'itemsvc:nameduseritem:*',
					_criteria: {
						_itemClass: "NamedUserCollection",
						_userType: 'document-logs'
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["READ", "CREATE"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: 'itemsvc:nameduseritem:*',
					_criteria: {
						_itemClass: "NamedUserCollection",
						_userType: 'link-logs'
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})

		} else if (group._name === 'Section Contributor') {

			perms.push({
				_actions: ["READ"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: `itemsvc:nameduseritem:${subsectionCollection._id}`,
					_subresourceDesc: {
						_type: 'relateditem',
						_criteria: {
							sectionId: section._id
						}
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["CREATE"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: `itemsvc:nameduseritem:${linkCollection._id}`,
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["READ", "EDIT"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: `itemsvc:nameduseritem:${linkCollection._id}`,
					_subresourceDesc: {
						_type: 'relateditem',
						_criteria: {
							sectionId: section._id
						}
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["READ", "CREATE"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: 'itemsvc:nameduseritem:*',
					_criteria: {
						_itemClass: "NamedUserCollection",
						_userType: 'document-logs'
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["READ", "CREATE"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: 'itemsvc:nameduseritem:*',
					_criteria: {
						_itemClass: "NamedUserCollection",
						_userType: 'link-logs'
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})

		} else if (group._name === 'Section Viewer') {

			perms.push({
				_actions: ["READ"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: `itemsvc:nameduseritem:${subsectionCollection._id}`,
					_subresourceDesc: {
						_type: 'relateditem',
						_criteria: {
							sectionId: section._id
						}
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["READ"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: `itemsvc:nameduseritem:${linkCollection._id}`,
					_subresourceDesc: {
						_type: 'relateditem',
						_criteria: {
							sectionId: section._id
						}
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["READ"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: 'itemsvc:nameduseritem:*',
					_criteria: {
						_itemClass: "NamedUserCollection",
						_userType: 'document-logs'
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})
			perms.push({
				_actions: ["READ"],
				_namespace: ctx._namespaces[0],
				_resourceDesc: {
					_irn: 'itemsvc:nameduseritem:*',
					_criteria: {
						_itemClass: "NamedUserCollection",
						_userType: 'link-logs'
					}
				},
				_user: {
					_id: group._id,
					_type: 'usergroup'
				}
			})

		}

		return perms
	})

	try {
		let itemRes = await IafItemSvc.createPermissions(sectionItemServicePerms.flat(), ctx)
		console.info('Item Service Permissions Result:')
		console.info(JSON.stringify(itemRes))

		return { statusCode: 200, statusText: "OK", message: "Section Groups and  Permissions Created", groups: {
			admin: sectionAdminGroup._id,
			contributor: sectionContributorGroup._id,
			viewer: sectionViewerGroup._id
		} }
	} catch (error) {
		console.error('Error Creating Section Item Service Permissions:')
		console.log(error)
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Creating Section Item Service Permissions" }
	}

}
// #endregion

//ENDPOINT SCRIPTS

// #region getStatus
function getStatus(input, libraries, ctx) {

	console.info(input)
	return { statusCode: 200, statusText: "OK", message: "Sections API Available" }

}
// #endregion

// #region getSections
async function getSections(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	const trash = input.params.trash === 'true'

	const collection = await _getSectionsCollection(libraries, ctx)

	const _pageSize = 100
	let _offset = 0
	let total = 0
	let sections = []

	do {

		let items = await IafItemSvc.getRelatedItems(collection._userItemId, {
			query: { trash }
		}, ctx, {
			page: { _pageSize, _offset }
		})

		total = items._total
		_offset += _pageSize

		sections.push(...items._list)

	} while (_offset < total)

	return { statusCode: 200, statusText: "OK", sections }

}
// #endregion

// #region getSubsectionStatus
async function getSubsectionStatus(input, libraries, ctx) {

	const { IafItemSvc, IafFileSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.id || !input.subid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section and Subsection IDs are required" }
	}

	if (input.id.length == 0 || input.subid.length == 0) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: sectionId, subsectionId" }
	}

	const subsectionCollection = await _getSubsectionsCollection(libraries, ctx)

	const subsection = (await IafItemSvc.getRelatedItems(subsectionCollection._userItemId, {
		query: { sectionId: input.id, _id: input.subid, trash: false }
	}, ctx))._list[0]

	if (!subsection) {
		return { statusCode: 404, statusText: "Not Found", message: "Subsection Not Found" }
	}

	let statusCounts = {}
	VALID_DOCUMENT_STATUSES.forEach(status => {
		statusCounts[status] = 0
	})
	statusCounts.total = 0

	const pageSize = 100
	let offset = 0
	let total = 0

	// TODO: Fetch counts by unique statud values
	/* 
	 * Currently Twinit does not suport file searchs by complex tag filters.
	 * Searching with one tag in the criteria string will return everythign with that tag.
	 * Searching with two tags will return any file with either tag.
	 * There's no way to search with files with both tags, or files without a tag.
	 * So below we need to cycle through every file in the subsection and count the files with each status.
	*/
	do {
		let files = await IafFileSvc.getFiles({ _parents: subsection.folderId }, ctx, { _pageSize: pageSize, _offset: offset })

		files._list.forEach(file => {
			if (!file._tags.includes('trash')) {
				let status = file._tags.find(tag => tag.startsWith('status:')).split(':')[1]
				statusCounts[status]++
			}
		})

		total = files._total
		offset += pageSize

	} while (offset < total)

	const linksCollection = await _getLinksCollection(libraries, ctx)

	let linkStatusPromises = []
	for (const status of VALID_DOCUMENT_STATUSES) {
		linkStatusPromises.push(IafItemSvc.getRelatedItems(linksCollection._userItemId, {
			query: { sectionId: input.id, subsectionId: input.subid, status: status, $or: [{ trash: false }, { trash: { $exists: false } }] }
		}, ctx, { page: { _pageSize: 0, _offset: 0 } }).then((result) => {
			return { status: status, count: result._total }
		}))
	}

	let linkStatusCounts = await Promise.all(linkStatusPromises)

	VALID_DOCUMENT_STATUSES.forEach(status => {
		let linkStatusCount = linkStatusCounts.find(result => result.status === status)?.count || 0
		statusCounts[status] += linkStatusCount
	})

	VALID_DOCUMENT_STATUSES.forEach(status => {
		statusCounts.total += statusCounts[status]
	})

	return { statusCode: 200, statusText: "OK", statusCounts, statusResults: statusCounts }

}
// #endregion

// #region createSection
async function createSection(input, libraries, ctx) {

	const { IafItemSvc, IafFileSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.params.number || !input.params.name) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section Number and Name are required" }
	}

	if (input.params.number.length > 5 || !input.params.number.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section Number must be more than 0 and less than 5 characters" }
	}

	if (input.params.name.length > 50 || !input.params.name.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section Number must be more than 0 and less than 50 characters" }
	}

	const collection = await _getSectionsCollection(libraries, ctx)

	// check for duplicates
	const duplicate = await IafItemSvc.getRelatedItems(collection._userItemId, {
		query: { $and: [{ trash: false }, { $or: [{ number: input.params.number }, { name: input.params.name }] }] }
	}, ctx, { page: { _pageSize: 0, _offset: 0 } })

	console.info('Duplicate:')
	console.info(JSON.stringify(duplicate))

	if (duplicate._total > 0) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section Number or Name already exists" }
	}

	try {
		// create section
		let createdSection = await IafItemSvc.createRelatedItems(collection._userItemId, [{
			name: input.params.name,
			number: input.params.number,
			trash: false
		}], ctx)

		//create section file service folder
		const folder = await IafFileSvc.addFolder(
			createdSection._list[0]._id,
			ctx._namespaces[0],
			undefined,
			ctx
		)

		// update section with folder id
		let updatedSection = await IafItemSvc.updateRelatedItem(collection._userItemId, createdSection._list[0]._id, {
			...createdSection._list[0],
			folderId: folder._id
		}, ctx)

		console.info('Updated Section:')
		console.info(JSON.stringify(updatedSection))

		let userGroupRes = await _createSectionUserGroups(updatedSection, libraries, ctx)
		console.info('User Group Permissions Result:')
		console.info(JSON.stringify(userGroupRes))

		// update section with folder id
		updatedSection = await IafItemSvc.updateRelatedItem(collection._userItemId, createdSection._list[0]._id, {
			...updatedSection,
			folderId: folder._id, 
			groups: userGroupRes.groups || {}
		}, ctx)

		console.info('Updated Section:')
		console.info(JSON.stringify(updatedSection))

		return { statusCode: 201, statusText: "Created", message: "Section Created", section: updatedSection }
	} catch (error) {
		return { statusCode: 500, statusText: "Internal Server Error", message: "Error Creating Section" }
	}

}
// #endregion

// #region updateSection
async function updateSection(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.id || !input.params._id || !input.params.name || !input.params.number || input.id !== input.params._id) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section ID, Number and Name are required" }
	}

	if (input.params.number.length > 5 || !input.params.number.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section Number must be more than 0 and less than 5 characters" }
	}

	if (input.params.name.length > 50 || !input.params.name.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section Number must be more than 0 and less than 50 characters" }
	}

	const collection = await _getSectionsCollection(libraries, ctx)

	// check for duplicates
	const currentSectionList = await IafItemSvc.getRelatedItems(collection._userItemId, {
		query: { _id: input.id }
	}, ctx)

	if (currentSectionList._total !== 1) {
		return { statusCode: 500, statusText: "Internal Error", message: "Multiple Section Numbers with duplicate _ids" }
	}

	const currentSection = currentSectionList._list[0]

	console.info('Current:')
	console.info(JSON.stringify(currentSection))

	let updatedSection = {
		...currentSection,
		name: input.params.name,
		number: input.params.number
	}

	console.info('Updated:')
	console.info(JSON.stringify(updatedSection))

	// update section
	let updatedSectionResult = await IafItemSvc.updateRelatedItem(collection._userItemId, updatedSection._id, updatedSection, ctx)

	return { statusCode: 200, statusText: "OK", message: "Section Updated", section: updatedSectionResult }

}
// #endregion

// #region trashSection
async function trashSection(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.id) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section ID is required" }
	}

	const collection = await _getSectionsCollection(libraries, ctx)

	const section = (await IafItemSvc.getRelatedItems(collection._userItemId, {
		query: { _id: input.id }
	}, ctx))._list[0]

	if (!section) {
		return { statusCode: 404, statusText: "Not Found", message: "Section Not Found" }
	}

	section.trash = true

	let trashedSection = await IafItemSvc.updateRelatedItem(collection._userItemId, input.id, section, ctx)

	return { statusCode: 200, statusText: "OK", message: "Section Moved to Trash", section: trashedSection }
}
// #endregion

// #region untrashSection
async function untrashSection(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.id) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section ID is required" }
	}

	const collection = await _getSectionsCollection(libraries, ctx)

	const section = (await IafItemSvc.getRelatedItems(collection._userItemId, {
		query: { _id: input.id }
	}, ctx))._list[0]

	if (!section) {
		return { statusCode: 404, statusText: "Not Found", message: "Section Not Found" }
	}

	section.trash = false

	let untrashedSection = await IafItemSvc.updateRelatedItem(collection._userItemId, input.id, section, ctx)

	return { statusCode: 200, statusText: "OK", message: "Section Restored from Trash", section: untrashedSection }
}
// #endregion

// #region deleteSection
async function deleteSection(input, libraries, ctx) {

	const { IafItemSvc, IafFileSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.id) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section ID is required" }
	}

	const collection = await _getSectionsCollection(libraries, ctx)

	const section = (await IafItemSvc.getRelatedItems(collection._userItemId, {
		query: { _id: input.id }
	}, ctx))._list[0]

	if (!section || !section.trash) {
		return { statusCode: 404, statusText: "Not Found", message: "Section Not Found in the Trash Bin" }
	}

	// get all subsections
	const subsectionsCollection = await _getSubsectionsCollection(libraries, ctx)

	const subsections = await IafItemSvc.getRelatedItems(subsectionsCollection._userItemId, {
		query: { sectionId: input.id }
	}, ctx, { page: { _pageSize: 1000, _offset: 0 } })

	if (subsections._total > 0) {

		// delete the file service folders for each subsection
		// this deletes all files in the folders as well
		await IafFileSvc.deleteFiles(subsections._list.map(subsection => subsection.folderId), ctx)

		// delete all links in section
		const linksCollection = await _getLinksCollection(libraries, ctx)
		const links = await IafItemSvc.getRelatedItems(linksCollection._userItemId, {
			query: { sectionId: input.id }
		}, ctx, { page: { _pageSize: 1000, _offset: 0 } })
		if (links._total > 0) {
			await IafItemSvc.deleteRelatedItems(linksCollection._userItemId, links._list.map(link => link._id), ctx)
		}

		// delete the subsections
		await IafItemSvc.deleteRelatedItems(subsectionsCollection._userItemId, subsections._list.map(subsection => subsection._id), ctx)
	}

	// delete the section folder
	await IafFileSvc.deleteFiles([section.folderId], ctx)
	// finally delete section
	let deletedSection = await IafItemSvc.deleteRelatedItem(collection._userItemId, input.id, ctx)

	return { statusCode: 200, statusText: "OK", message: "Section Deleted" }
}
// #endregion

// #region getSubsections
async function getSubsections(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	const trash = input.params.trash === 'true'

	// validate input
	if (!input.id) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section ID is required" }
	}

	const subsectionCollection = await _getSubsectionsCollection(libraries, ctx)

	const _pageSize = 100
	let _offset = 0
	let total = 0
	let subsections = []

	do {

		let items = await IafItemSvc.getRelatedItems(subsectionCollection._userItemId, {
			query: { sectionId: input.id, trash }
		}, ctx, { page: { _pageSize, _offset } })

		total = items._total
		_offset += _pageSize

		subsections.push(...items._list)

	} while (_offset < total)

	return { statusCode: 200, statusText: "OK", subsections }

}
// #endregion

// #region createSubsection
async function createSubsection(input, libraries, ctx) {

	const { IafItemSvc, IafFileSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.params.name || !input.params.number || !input.id) {
		return { statusCode: 400, statusText: "Bad Request", message: "Name, Number and Section ID are required", input }
	}

	if (input.params.number.length > 5 || !input.params.number.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Subsection Number must be more than 0 and less than 5 characters" }
	}

	if (input.params.name.length > 50 || !input.params.name.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Subsection Number must be more than 0 and less than 50 characters" }
	}

	const sectionCollection = await _getSectionsCollection(libraries, ctx)
	const subsectionCollection = await _getSubsectionsCollection(libraries, ctx)

	// check for duplicates
	const duplicate = await IafItemSvc.getRelatedItems(subsectionCollection._userItemId, {
		query: { $and: [{ trash: false }, { $or: [{ number: input.params.number }, { name: input.params.name }] }] }
	}, ctx, { page: { _pageSize: 0, _offset: 0 } })

	if (duplicate._total > 0) {
		return { statusCode: 400, statusText: "Bad Request", message: "Subsection Number or Name already exists" }
	}

	let section = (await IafItemSvc.getRelatedItems(sectionCollection._userItemId, {
		query: { _id: input.id }
	}, ctx))._list[0]

	if (!section) {
		return { statusCode: 404, statusText: "Not Found", message: "Section Not Found" }
	}

	// create the item
	let newSubsection = (await IafItemSvc.createRelatedItems(subsectionCollection._userItemId, [{
		name: input.params.name,
		number: input.params.number,
		description: input.params.description || '',
		sectionId: input.id,
		trash: false,
		folderId: 'creating'
	}], ctx))._list[0]

	// create the file service folder in the section folder
	const folder = await IafFileSvc.addFolder(
		newSubsection._id,
		ctx._namespaces[0],
		[section.folderId],
		ctx
	)

	// update the item with the folder id
	let updatedSubsection = await IafItemSvc.updateRelatedItem(subsectionCollection._userItemId, newSubsection._id, {
		...newSubsection,
		folderId: folder._id
	}, ctx)

	return { statusCode: 201, statusText: "Created", message: "Subsection Created", subsection: updatedSubsection }

}
// #endregion

// #region updateSubsection
async function updateSubsection(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.id || !input.subid || !input.params._id || !input.params.name || !input.params.number || input.id !== input.params.sectionId || input.subid !== input.params._id) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section and Subsection IDs, Number and Name are required" }
	}

	if (input.params.number.length > 5 || !input.params.number.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section Number must be more than 0 and less than 5 characters" }
	}

	if (input.params.name.length > 50 || !input.params.name.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section Number must be more than 0 and less than 50 characters" }
	}

	const subsectionCollection = await _getSubsectionsCollection(libraries, ctx)

	// check for duplicates
	const currentSubsectionList = await IafItemSvc.getRelatedItems(subsectionCollection._userItemId, {
		query: { _id: input.subid, sectionId: input.id }
	}, ctx)

	if (currentSubsectionList._total !== 1) {
		return { statusCode: 500, statusText: "Internal Error", message: "Multiple Subsection Numbers with duplicate _ids" }
	}

	const currentSubsection = currentSubsectionList._list[0]

	console.info('Current Subsection:')
	console.info(JSON.stringify(currentSubsection))

	let updatedSubsection = {
		...currentSubsection,
		name: input.params.name,
		number: input.params.number,
		description: input.params.description || '',
		trash: input.params.trash
	}

	console.info('Updated Subsection:')
	console.info(JSON.stringify(updatedSubsection))

	// update subsection
	let updatedSubsectionResult = await IafItemSvc.updateRelatedItem(subsectionCollection._userItemId, updatedSubsection._id, updatedSubsection, ctx)

	return { statusCode: 200, statusText: "OK", message: "Subsection Updated", subsection: updatedSubsectionResult }

}
// #endregion

// #region trashSubsection
async function trashSubsection(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.id || !input.subid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section and Subsection IDs are required" }
	}

	const subsectionCollection = await _getSubsectionsCollection(libraries, ctx)

	const subsection = (await IafItemSvc.getRelatedItems(subsectionCollection._userItemId, {
		query: { sectionId: input.id, _id: input.subid, trash: false }
	}, ctx))._list[0]

	if (!subsection) {
		return { statusCode: 404, statusText: "Not Found", message: "Subsection Not Found" }
	}

	subsection.trash = true

	let trashedSubsection = await IafItemSvc.updateRelatedItem(subsectionCollection._userItemId, input.subid, subsection, ctx)

	return { statusCode: 200, statusText: "OK", message: "Subsection Moved to Trash", subsection: trashedSubsection }
}
// #endregion

// #region untrashSubsection
async function untrashSubsection(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.id || !input.subid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section and Subsection IDs are required" }
	}

	const subsectionCollection = await _getSubsectionsCollection(libraries, ctx)

	const subsection = (await IafItemSvc.getRelatedItems(subsectionCollection._userItemId, {
		query: { sectionId: input.id, _id: input.subid, trash: true }
	}, ctx))._list[0]

	if (!subsection) {
		return { statusCode: 404, statusText: "Not Found", message: "Subsection Not Found" }
	}

	subsection.trash = false

	let untrashedSubsection = await IafItemSvc.updateRelatedItem(subsectionCollection._userItemId, input.subid, subsection, ctx)

	return { statusCode: 200, statusText: "OK", message: "Subsection Restored from Trash", subsection: untrashedSubsection }
}
// #endregion

// #region deleteSubsection
async function deleteSubsection(input, libraries, ctx) {

	const { IafItemSvc, IafFileSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.id || !input.subid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section and Subsection IDs are required" }
	}

	const subsectionCollection = await _getSubsectionsCollection(libraries, ctx)

	const subsection = (await IafItemSvc.getRelatedItems(subsectionCollection._userItemId, {
		query: { sectionId: input.id, _id: input.subid }
	}, ctx))._list[0]

	if (!subsection || !subsection.trash) {
		return { statusCode: 404, statusText: "Not Found", message: "Subsection Not Found in the Trash Bin" }
	}

	try {
		// delete the file service folder for the subsection
		await IafFileSvc.deleteFile(subsection.folderId, ctx)
	} catch (error) {
		console.error('Error Deleting Subsection File Service Folder')
		console.error(error)
	}

	// delete all links in subsection
	const linksCollection = await _getLinksCollection(libraries, ctx)
	const links = await IafItemSvc.getRelatedItems(linksCollection._userItemId, {
		query: { sectionId: input.id, subsectionId: input.subid }
	}, ctx, { page: { _pageSize: 1000, _offset: 0 } })

	if (links._total > 0) {
		await IafItemSvc.deleteRelatedItems(linksCollection._userItemId, links._list.map(link => link._id), ctx)
	}

	// delete the subsection
	let deletedSubsection = await IafItemSvc.deleteRelatedItem(subsectionCollection._userItemId, input.subid, ctx)

	return { statusCode: 200, statusText: "OK", message: "Subsection Deleted" }
}
// #endregion

// #region getDocuments
async function getDocuments(input, libraries, ctx) {

	const { IafItemSvc, IafFileSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	// validate input
	if (!input.id || !input.subid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section and Subsection IDs are required" }
	}

	const subsectionCollection = await _getSubsectionsCollection(libraries, ctx)

	let subsection = (await IafItemSvc.getRelatedItems(subsectionCollection._userItemId, {
		query: { sectionId: input.id, _id: input.subid, trash: false }
	}, ctx))._list[0]

	const _pageSize = 100
	let _offset = 0
	let total = 0
	let documents = []

	do {

		let files = await IafFileSvc.getFiles({ _parents: subsection.folderId }, ctx, { _pageSize, _offset }, true)

		total = files._total
		_offset += _pageSize

		documents.push(...files._list.filter(file => !file._tags.includes('trash')))

	} while (_offset < total)

	return { statusCode: 200, statusText: "OK", documents }

}
// #endregion

// #region getLinks
async function getLinks(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.id || !input.subid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section and Subsection IDs are required" }
	}

	const linksCollection = await _getLinksCollection(libraries, ctx)

	let links = []
	let _pageSize = 100
	let _offset = 0
	let total = 0

	do {
		let items = await IafItemSvc.getRelatedItems(linksCollection._userItemId, {
			query: { sectionId: input.id, subsectionId: input.subid, $or: [{ trash: false }, { trash: { $exists: false } }] }
		}, ctx, { page: { _pageSize, _offset } })

		total = items._total
		_offset += _pageSize

		links.push(...items._list)

	} while (_offset < total)

	return { statusCode: 200, statusText: "OK", links }
}
// #endregion

// #region createLink
async function createLink(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.id || !input.subid || !input.params.name || !input.params.url) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section, Subsection IDs, name, and url are required" }
	}

	if (!input.params.name.length || !input.params.url.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Name, and url are required" }
	}

	const linksCollection = await _getLinksCollection(libraries, ctx)

	let newLink = {
		name: input.params.name,
		url: input.params.url,
		description: input.params.description || '',
		sectionId: input.id,
		subsectionId: input.subid,
		status: 'For Review'
	}

	let createdLinkResp = await IafItemSvc.createRelatedItems(linksCollection._userItemId, [newLink], ctx)

	let createdLink = createdLinkResp._list[0]

	let newLinkLogInput = {
		id: input.id,
		subid: input.subid,
		linkid: createdLink._id,
		params: {
			status: 'For Review',
			message: 'Link Created'
		}
	}

	await createLinkLog(newLinkLogInput, libraries, ctx)

	return { statusCode: 201, statusText: "Created", message: "Link Created", link: createdLink }

}
// #endregion

// #region trashLink
async function trashLink(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.id || !input.subid || !input.linkid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section, Subsection IDs, and Link ID are required" }
	}

	const linksCollection = await _getLinksCollection(libraries, ctx)

	let link = (await IafItemSvc.getRelatedItems(linksCollection._userItemId, {
		query: { _id: input.linkid }
	}, ctx))._list[0]

	link.trash = true

	let trashedLink = await IafItemSvc.updateRelatedItem(linksCollection._userItemId, input.linkid, link, ctx)

	let newLinkLogInput = {
		id: input.id,
		subid: input.subid,
		linkid: input.linkid,
		params: {
			status: link.status,
			message: 'Link Moved to Trash'
		}
	}

	await createLinkLog(newLinkLogInput, libraries, ctx)

	return { statusCode: 200, statusText: "OK", message: "Link Moved to Trash", link: trashedLink }

}
// #endregion

// #region untrashLink
async function untrashLink(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.id || !input.subid || !input.linkid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section, Subsection IDs, and Link ID are required" }
	}

	const linksCollection = await _getLinksCollection(libraries, ctx)

	let existingLink = (await IafItemSvc.getRelatedItems(linksCollection._userItemId, {
		query: { _id: input.linkid }
	}, ctx))._list[0]

	existingLink.trash = false

	let untrashedLink = await IafItemSvc.updateRelatedItem(linksCollection._userItemId, input.linkid, existingLink, ctx)

	let newLinkLogInput = {
		id: input.id,
		subid: input.subid,
		linkid: input.linkid,
		params: {
			status: existingLink.status,
			message: 'Link Restored from Trash'
		}
	}

	await createLinkLog(newLinkLogInput, libraries, ctx)

	return { statusCode: 200, statusText: "OK", message: "Link Restored from Trash", link: untrashedLink }
}
// #endregion

// #region deleteLink
async function deleteLink(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.id || !input.subid || !input.linkid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section, Subsection IDs, and Link ID are required" }
	}

	const linksCollection = await _getLinksCollection(libraries, ctx)

	let link = (await IafItemSvc.getRelatedItems(linksCollection._userItemId, {
		query: { _id: input.linkid }
	}, ctx))._list[0]

	if (!link || !link.trash) {
		return { statusCode: 404, statusText: "Not Found", message: "Link Not Found in the Trash Bin" }
	}

	// delete the link
	let deletedLink = await IafItemSvc.deleteRelatedItem(linksCollection._userItemId, input.linkid, ctx)

	return { statusCode: 200, statusText: "OK", message: "Link Deleted" }
}
// #endregion

// #region createLinkLog
async function createLinkLog(input, libraries, ctx) {

	const { IafItemSvc, IafPassSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.id || !input.subid || !input.linkid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section, Subsection IDs, and Link ID are required" }
	}

	if (!input.params.status || !input.params.message) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Fields: status, message" }
	}

	if (input.params.status.length == 0 || input.params.message.length == 0) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: status, message" }
	}

	if (!VALID_DOCUMENT_STATUSES.includes(input.params.status)) {
		return { statusCode: 400, statusText: "Bad Request", message: "Invalid Status: " + input.params.status }
	}

	const linkLogsCollection = await _getLinkLogsCollection(libraries, ctx)

	const user = await IafPassSvc.getCurrentUser(ctx)

	let newLinkLog = {
		sectionId: input.id,
		subsectionId: input.subid,
		linkId: input.linkid,
		status: input.params.status,
		message: input.params.message,
		userId: user._id,
		username: `${user._firstname} ${user._lastname}`,
		note: input.params.note || '',
	}

	let createdLinkLog = await IafItemSvc.createRelatedItems(linkLogsCollection._userItemId, [newLinkLog], ctx)

	return { statusCode: 201, statusText: "Created", message: "Link Log Created", linkLog: createdLinkLog._list[0] }
}
// #endregion

// #region getLinkLogs
async function getLinkLogs(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.id || !input.subid || !input.linkid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section, Subsection IDs, and Link ID are required" }
	}

	const linkLogsCollection = await _getLinkLogsCollection(libraries, ctx)

	let _pageSize = 100
	let _offset = 0
	let total = 0
	let linkLogs = []

	do {
		let items = await IafItemSvc.getRelatedItems(linkLogsCollection._userItemId, {
			query: { sectionId: input.id, subsectionId: input.subid, linkId: input.linkid }
		}, ctx, { page: { _pageSize, _offset } })

		total = items._total
		_offset += _pageSize

		linkLogs.push(...items._list)

	} while (_offset < total)

	return { statusCode: 200, statusText: "OK", linkLogs }

}
// #endregion

// #region updateLinkStatus
async function updateLinkStatus(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))


	if (!input.id || !input.subid || !input.linkid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section, Subsection IDs, and Link ID are required" }
	}

	if (!input.params.status || !input.params.status.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: status, message" }
	}

	if (!VALID_DOCUMENT_STATUSES.includes(input.params.status)) {
		return { statusCode: 400, statusText: "Bad Request", message: "Invalid Status: " + input.params.status }
	}

	const linksCollection = await _getLinksCollection(libraries, ctx)

	let link = (await IafItemSvc.getRelatedItems(linksCollection._userItemId, {
		query: { _id: input.linkid, sectionId: input.id, subsectionId: input.subid }
	}, ctx))._list[0]

	link.status = input.params.status

	let updatedLink = await IafItemSvc.updateRelatedItem(linksCollection._userItemId, input.linkid, link, ctx)

	let newLinkLogInput = {
		id: input.id,
		subid: input.subid,
		linkid: input.linkid,
		params: {
			status: link.status,
			message: input.params.message || `Set status to ${input.params.status}`,
			note: input.params.note || ''
		}
	}

	await createLinkLog(newLinkLogInput, libraries, ctx)

	return { statusCode: 200, statusText: "OK", message: "Link Updated", link: updatedLink }

}
// #endregion

// #region updateLink
async function updateLink(input, libraries, ctx) {

	const { IafItemSvc } = libraries.PlatformApi

	console.info(JSON.stringify(input))

	if (!input.id || !input.subid || !input.linkid) {
		return { statusCode: 400, statusText: "Bad Request", message: "Section, Subsection IDs, and Link ID are required" }
	}

	if (!input.params.name || !input.params.name.length || !input.params.description || !input.params.description.length || !input.params.url || !input.params.url.length) {
		return { statusCode: 400, statusText: "Bad Request", message: "Missing Required Field Values: name, description, url" }
	}

	const linksCollection = await _getLinksCollection(libraries, ctx)

	let link = (await IafItemSvc.getRelatedItems(linksCollection._userItemId, {
		query: { _id: input.linkid, sectionId: input.id, subsectionId: input.subid }
	}, ctx))._list[0]

	link.name = input.params.name || link.name
	link.description = input.params.description || link.description
	link.url = input.params.url || link.url

	let updatedLink = await IafItemSvc.updateRelatedItem(linksCollection._userItemId, input.linkid, link, ctx)

	let newLinkLogInput = {
		id: input.id,
		subid: input.subid,
		linkid: input.linkid,
		params: {
			status: link.status,
			message: 'Link Updated',
			note: `Updated link name to ${input.params.name}, description to ${input.params.description}, and url to ${input.params.url}`
		}
	}

	await createLinkLog(newLinkLogInput, libraries, ctx)

	return { statusCode: 200, statusText: "OK", message: "Link Updated", link: updatedLink }

}
// #endregion
