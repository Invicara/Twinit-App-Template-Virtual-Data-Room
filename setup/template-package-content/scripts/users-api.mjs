// #region getMe
async function getMe(input, libraries, ctx) {

	const { IafPassSvc } = libraries.PlatformApi	

	const user = await IafPassSvc.getCurrentUser(ctx)

	const projectReq = await IafPassSvc.getWorkspaces({_namespaces: ctx._namespaces}, ctx, { _pageSize: 1000 })
	const project = projectReq._list.find(p => p._namespaces.includes(ctx._namespaces[0]))

	if (!project) {
		return { statusCode: 404, statusText: 'Not Found', message: 'Project not found' }
	}

	let groups = []
	const _pageSize = 1000
	let _offset = 0
	let total = 0

	do {

		let groupPage = await IafPassSvc.getUserGroups({ }, ctx, { _pageSize, _offset })

		total = groupPage._total
		_offset += _pageSize

		groups.push(...groupPage._list.filter(group => group._userAttributes?.project_workspace?._id === project._id))

	} while (_offset < total)

	let roles = {}

	if (groups.find(group => group._name === 'Room Admin')) {
		roles.room_admin = true
	} else {
		let sections = new Set()
		groups.forEach(group => {
			sections.add(group._userAttributes?.section)
		})

		for (const section of sections) {
			if (groups.find(group => group._userAttributes?.section === section && group._name === 'Section Admin')) {
				roles[section] = 'Section Admin'
			} else if (groups.find(group => group._userAttributes?.section === section && group._name === 'Section Contributor')) {
				roles[section] = 'Section Contributor'
			} else {
				roles[section] = 'Section Viewer'
			}
		}

	}


	return { statusCode: 200, statusText: 'OK', message: 'User retrieved', data: { user, roles } }

}
// #endregion

// #region getUserGroups
async function getUserGroups(input, libraries, ctx) {

	const { IafPassSvc } = libraries.PlatformApi	

	const projectReq = await IafPassSvc.getWorkspaces({_namespaces: ctx._namespaces}, ctx, { _pageSize: 1000 })
	const project = projectReq._list.find(p => p._namespaces.includes(ctx._namespaces[0]))

	if (!project) {
		return { statusCode: 404, statusText: 'Not Found', message: 'Project not found' }
	}

	let groups = []
	const _pageSize = 1000
	let _offset = 0
	let total = 0

	do {

		let groupPage = await IafPassSvc.getUserGroups({ }, ctx, { _pageSize, _offset, includeAll: true })

		total = groupPage._total
		_offset += _pageSize

		groups.push(...groupPage._list.filter(group => group._userAttributes?.project_workspace?._id === project._id))

	} while (_offset < total)

	for (const group of groups) {
		const invitesResult = await IafPassSvc.getUserGroupInvites(
			group._id,
			{_status: ['PENDING', 'EXPIRED', 'REJECTED']},
			ctx,
			{ _pageSize: 1000 }
		);
		group.invites = invitesResult?._list ?? [];
	}

	return { statusCode: 200, statusText: 'OK', message: 'Groups retrieved', groups }

}
// #endregion

// #region getGroupUsers
async function getGroupUsers(input, libraries, ctx) {

	const { IafPassSvc } = libraries.PlatformApi	

	let users = []
	const _pageSize = 10
	let _offset = 0
	let total = 0

	do {
		let userPage = await IafPassSvc.getUsersInGroup(input.groupid, ctx, { _pageSize, _offset })
		total = userPage._total
		_offset += _pageSize
		users.push(...userPage._list)
	} while (_offset < total)

	return { statusCode: 200, statusText: 'OK', message: 'Users retrieved', users }
}
// #endregion

// #region inviteUsers
async function inviteUsers(input, libraries, ctx) {

	const { IafPassSvc } = libraries.PlatformApi

	if (!input.params.email || input.params.email.length === 0 || !input.params.base_url || input.params.base_url.length === 0) {
		return { statusCode: 400, statusText: 'Bad Request', message: 'Email and invite link is required' }
	}

	if (!input.params.groups || input.params.groups.length === 0) {
		return { statusCode: 400, statusText: 'Bad Request', message: 'Groups are required' }
	}

	if (!input.params.groups.every(group => group.groupId && group.groupName && group.section && group.section.number && group.section.name)) {
		return { statusCode: 400, statusText: 'Bad Request', message: 'Group Info is required' }
	}

	const projectReq = await IafPassSvc.getWorkspaces({_namespaces: ctx._namespaces}, ctx, { _pageSize: 1000 })
	const project = projectReq._list.find(p => p._namespaces.includes(ctx._namespaces[0]))

	if (!project) {
		return { statusCode: 404, statusText: 'Not Found', message: 'Project not found' }
	}

	let invites = []
	input.params.groups.forEach(group => {
		invites.push([
			group.groupId,
			{
				_email: input.params.email,
				_params: {
					subject: `You've been invited to a Virtual Data Room`,
					body_header: `Join the ${project._name} Virtual Data Room`,
					name: `Section ${group.section.number} ${group.section.name}`,
					body_content: `You have been invited to participate as a ${group.groupName}.`,
					base_url: `${input.params.base_url}`
				}
			}
		])
	})

	let invitePromises = invites.map(invite => IafPassSvc.inviteUsersToGroup(invite[0], [invite[1]], ctx))
	let sentInvites = await Promise.all(invitePromises)

	return { statusCode: 200, statusText: 'OK', message: 'Invites sent', data: sentInvites }
}
// #endregion

// #region getAllUsers
async function getAllUsers(input, libraries, ctx) {

	const { IafPassSvc } = libraries.PlatformApi

	const groups = (await getUserGroups({}, libraries, ctx)).groups

	const userMap = new Map()
	const _pageSize = 100

	for (const group of groups) {
		let _offset = 0
		let total = 0
		do {
			const userPage = await IafPassSvc.getUsersInGroup(group._id, ctx, { _pageSize, _offset })
			total = userPage._total
			for (const u of (userPage._list || [])) {
				if (u._id && !userMap.has(u._id) && ctx.principalInfo._userid !== u._id) {
					userMap.set(u._id, {
						_id: u._id,
						_firstname: u._firstname || '',
						_lastname: u._lastname || '',
						_email: u._email || ''
					})
				}
			}
			_offset += _pageSize
		} while (_offset < total)
	}

	const users = Array.from(userMap.values()).sort((a, b) => {
		const nameA = `${a._lastname} ${a._firstname}`.toLowerCase()
		const nameB = `${b._lastname} ${b._firstname}`.toLowerCase()
		return nameA.localeCompare(nameB)
	})

	return { statusCode: 200, statusText: 'OK', message: 'Users retrieved', users }

}
// #endregion

// #region cancelInvite
async function cancelInvite(input, libraries, ctx) {

	const { IafPassSvc } = libraries.PlatformApi

	const groupid = typeof input.groupid === 'string' ? input.groupid.trim() : ''
	const inviteid = typeof input.inviteid === 'string' ? input.inviteid.trim() : ''

	if (!groupid || !inviteid) {
		return { statusCode: 400, statusText: 'Bad Request', message: 'Group id and invite id are required' }
	}

	await IafPassSvc.updateUserGroupInvite(groupid, inviteid, { _status: 'CANCELLED' }, ctx)

	return { statusCode: 200, statusText: 'OK', message: 'Invite cancelled' }

}
// #endregion

// #region removeUserFromGroup
async function removeUserFromGroup(input, libraries, ctx) {

	const { IafPassSvc } = libraries.PlatformApi

	const groupid = typeof input.groupid === 'string' ? input.groupid.trim() : ''
	const userid = typeof input.userid === 'string' ? input.userid.trim() : ''

	if (!groupid || !userid) {
		return { statusCode: 400, statusText: 'Bad Request', message: 'Group id and user id are required' }
	}

	if (ctx.principalInfo._userid && ctx.principalInfo._userid === userid) {
		return { statusCode: 403, statusText: 'Forbidden', message: 'You cannot remove yourself from a group' }
	}

	const projectReq = await IafPassSvc.getWorkspaces({ _namespaces: ctx._namespaces }, ctx, { _pageSize: 1000 })
	const project = projectReq._list.find(p => p._namespaces.includes(ctx._namespaces[0]))

	if (!project) {
		return { statusCode: 404, statusText: 'Not Found', message: 'Project not found' }
	}

	await IafPassSvc.deleteUsersFromGroup(groupid, [userid], ctx)

	return { statusCode: 200, statusText: 'OK', message: 'User removed from group' }

}
// #endregion

// #region removeUserFromAllGroups
async function removeUserFromAllGroups(input, libraries, ctx) {

	const { IafPassSvc } = libraries.PlatformApi

	const userid = typeof input.userid === 'string' ? input.userid.trim() : ''

	if (!userid || userid.length === 0) {
		return { statusCode: 400, statusText: 'Bad Request', message: 'User id is required' }
	}

	if (ctx.principalInfo._userid && ctx.principalInfo._userid === userid) {
		return { statusCode: 403, statusText: 'Forbidden', message: 'You cannot remove yourself from groups' }
	}

	let groups = (await getUserGroups({}, libraries, ctx)).groups

	for (const group of groups) {
		try {
			await IafPassSvc.deleteUsersFromGroup(group._id, [userid], ctx)
		} catch (error) {
			console.log(error)
		}
	}

	return { statusCode: 200, statusText: 'OK', message: 'User removed from all groups' }

}
// #endregion
