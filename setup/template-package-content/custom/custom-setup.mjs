const docLogsIndexes = [{
    key: {
        'fileid': 1,
        'versionid': 1
    },
    options: {
        name: 'docLogsfileversionIndex'
    }
}]

const linkLogsIndexes = [{
    key: {
        'sectionId': 1,
        'subsectionId': 1,
        'linkid': 1,
    },
    options: {
        name: 'linkLogsIndex'
    }
}]

const linksIndexes = [{
    key: {
        'sectionId': 1,
        'subsectionId': 1
    },
    options: {
        name: 'linksIndex'
    }
}]

const subsectionsIndexes = [{
    key: {
        'sectionId': 1
    },
    options: {
        name: 'subsectionsSectionIdIndex'
    }
}]

export async function setup(input, libraries, ctx, callback) {

    const { IafItemSvc, IafPassSvc } = libraries.PlatformApi
    const { packageData } = input

    callback('INFO: Creating collection indexes...')

    const collections = await IafItemSvc.getNamedUserItems({ query: { _itemClass: 'NamedUserCollection'}}, ctx);

    const addIndexes = async (collection, indexes) => {
        await IafItemSvc.createIndex(collection._userItemId, indexes, ctx)
        callback(`INFO: Created indexes for ${collection._name}`)
    }

    for (const collection of collections._list) {
        if (collection._name === 'Document Logs') {
            await addIndexes(collection, docLogsIndexes)
        } else if (collection._name === 'Link Logs') {
            await addIndexes(collection, linkLogsIndexes)
        } else if (collection._name === 'Links') {
            await addIndexes(collection, linksIndexes)
        } else if (collection._name === 'Subsections') {
            await addIndexes(collection, subsectionsIndexes)
        }
    }

    callback('INFO: Updating Invite Templates...')

    let templates = await IafPassSvc.getNotificationTemplates([], ctx)

    let invite = templates._list.find(template => template._name === 'USER_GROUP_INVITE')
    if (!invite) {
        callback('ERROR: Invite template not found')
        return
    }

    invite._message = await packageData.file('custom/invite.html').async('string')

    console.log(invite)

    let invres = await IafPassSvc.updateNotificationTemplate(invite._id, invite, ctx)

    console.log(invres)
    callback(`INFO: Updated Invite template`)

    let inviteReminder = templates._list.find(template => template._name === 'USER_GROUP_INVITE_REMINDER')
    if (!inviteReminder) {
        callback('ERROR: Invite Reminder template not found')
        return
    }

    inviteReminder._title = "Reminder: Invitation to join a Room"
    inviteReminder._message = await packageData.file('custom/invite_reminder.html').async('string')

    console.log(inviteReminder)

    let invremres = await IafPassSvc.updateNotificationTemplate(inviteReminder._id, inviteReminder, ctx)

    console.log(invremres)
    callback(`INFO: Updated Invite Reminder template`)

}