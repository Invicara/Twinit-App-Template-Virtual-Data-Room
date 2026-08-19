import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useProject } from '../context/ProjectContext'
import { getAccessToken } from '../auth/auth'
import { apiFetch } from './apiFetch'

const _getSubsections = async (accessToken, namespace, sectionId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.subsections.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })))
}

export const useSubsections = (sectionId, { enabled = true } = {}) => {

    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({
        queryKey: ['subsections', project._namespaces[0], sectionId],
        queryFn: () => _getSubsections(accessToken, project._namespaces[0], sectionId),
        enabled: enabled && !!project && !!accessToken && !!sectionId
    })

}

const _getSubsectionStatus = async (accessToken, namespace, sectionId, subsectionId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/status`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.statusCounts)
}

export const useSubsectionStatus = (sectionId, subsectionId) => {

    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({

        queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId],
        queryFn: () => _getSubsectionStatus(accessToken, project._namespaces[0], sectionId, subsectionId),
        enabled: !!project && !!accessToken && !!sectionId && !!subsectionId
    })

}

const _createSubsection = async (accessToken, namespace, sectionId, subsectionData) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subsectionData)
    })
}

export const useCreateSubsection = () => {

    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({

        mutationFn: ({ sectionId, subsectionData }) => _createSubsection(accessToken, project._namespaces[0], sectionId, subsectionData),
        onSuccess: (data, { sectionId }) => {
            queryClient.invalidateQueries({ queryKey: ['subsections', project._namespaces[0], sectionId] })
        }

    })

}

const _updateSubsection = async (accessToken, namespace, sectionId, subsectionData) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionData._id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subsectionData)
    })
}

export const useUpdateSubsection = () => {

    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({

        mutationFn: ({ sectionId, subsectionData }) => _updateSubsection(accessToken, project._namespaces[0], sectionId, subsectionData),
        onSuccess: (data, { sectionId }) => {
            queryClient.invalidateQueries({ queryKey: ['subsections', project._namespaces[0], sectionId] })
        }

    })

}

const _getLinks = async (accessToken, namespace, sectionId, subsectionId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/links`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.links)
}

export const useLinks = (sectionId, subsectionId, { enabled = true } = {}) => {
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({
        queryKey: ['links', project._namespaces[0], sectionId, subsectionId],
        queryFn: () => _getLinks(accessToken, project._namespaces[0], sectionId, subsectionId),
        enabled: enabled && !!project && !!accessToken && !!sectionId && !!subsectionId
    })
}

const _createLink = async (accessToken, namespace, sectionId, subsectionId, linkData) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/links`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkData)
    })
}

export const useCreateLink = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId, linkData }) => _createLink(accessToken, project._namespaces[0], sectionId, subsectionId, linkData),
        onSuccess: (data, { sectionId, subsectionId }) => {
            queryClient.invalidateQueries({ queryKey: ['links', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId] })
        }
    })
}

const _trashLink = async (accessToken, namespace, sectionId, subsectionId, linkId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/links/${linkId}/trash`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
}

export const useTrashLink = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId, linkId }) => _trashLink(accessToken, project._namespaces[0], sectionId, subsectionId, linkId),
        onSuccess: (data, { sectionId, subsectionId, linkId }) => {
            queryClient.invalidateQueries({ queryKey: ['links', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId] })
        }
    })
}

const _getLinkLogs = async (accessToken, namespace, sectionId, subsectionId, linkId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/links/${linkId}/logs`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.linkLogs)
}

export const useLinkLogs = (sectionId, subsectionId, linkId, { enabled = true } = {}) => {
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({
        queryKey: ['linkLogs', project._namespaces[0], sectionId, subsectionId, linkId],
        queryFn: () => _getLinkLogs(accessToken, project._namespaces[0], sectionId, subsectionId, linkId),
        enabled: enabled && !!project && !!accessToken && !!sectionId && !!subsectionId && !!linkId
    })
}

const _updateLinkStatus = async (accessToken, namespace, sectionId, subsectionId, linkId, linkData) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/links/${linkId}/status`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkData)
    })
}

export const useUpdateLinkStatus = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId, linkId, linkData }) => _updateLinkStatus(accessToken, project._namespaces[0], sectionId, subsectionId, linkId, linkData),
        onSuccess: (data, { sectionId, subsectionId, linkId }) => {
            queryClient.invalidateQueries({ queryKey: ['links', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['linkLogs', project._namespaces[0], sectionId, subsectionId, linkId] })
        }
    })
}

const _updateLink = async (accessToken, namespace, sectionId, subsectionId, linkId, linkData) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/links/${linkId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkData)
    }).then(data => data._result.link)
}

export const useUpdateLink = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId, linkId, linkData }) => _updateLink(accessToken, project._namespaces[0], sectionId, subsectionId, linkId, linkData),
        onSuccess: (data, { sectionId, subsectionId, linkId }) => {
            queryClient.invalidateQueries({ queryKey: ['links', project._namespaces[0], sectionId, subsectionId] })
        }
    })
}

const _untrashLink = async (accessToken, namespace, sectionId, subsectionId, linkId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/links/${linkId}/untrash`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
}

export const useUntrashLink = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId, linkId }) => _untrashLink(accessToken, project._namespaces[0], sectionId, subsectionId, linkId),
        onSuccess: (data, { sectionId, subsectionId, linkId }) => {
            queryClient.invalidateQueries({ queryKey: ['links', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['searchTrash', project._namespaces[0]] })
        }
    })
}

const _trashSubsection = async (accessToken, namespace, sectionId, subsectionId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/trash`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
}

export const useTrashSubsection = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId }) => _trashSubsection(accessToken, project._namespaces[0], sectionId, subsectionId),
        onSuccess: (data, { sectionId, subsectionId }) => {
            queryClient.invalidateQueries({ queryKey: ['subsections', project._namespaces[0], sectionId] })
        }
    })
}

const _untrashSubsection = async (accessToken, namespace, sectionId, subsectionId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/untrash`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
}

export const useUntrashSubsection = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId }) => _untrashSubsection(accessToken, project._namespaces[0], sectionId, subsectionId),
        onSuccess: (data, { sectionId, subsectionId }) => {
            queryClient.invalidateQueries({ queryKey: ['subsections', project._namespaces[0], sectionId] })
            queryClient.invalidateQueries({ queryKey: ['searchTrash'] })
        }
    })
}

const _deleteSubsection = async (accessToken, namespace, sectionId, subsectionId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
}

export const useDeleteSubsection = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId }) => _deleteSubsection(accessToken, project._namespaces[0], sectionId, subsectionId),
        onSuccess: (data, { sectionId, subsectionId }) => {
            queryClient.invalidateQueries({ queryKey: ['subsections', project._namespaces[0], sectionId] })
            queryClient.invalidateQueries({ queryKey: ['searchTrash'] })
        }
    })
}

const _deleteLink = async (accessToken, namespace, sectionId, subsectionId, linkId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/links/${linkId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
}

export const useDeleteLink = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId, linkId }) => _deleteLink(accessToken, project._namespaces[0], sectionId, subsectionId, linkId),
        onSuccess: (data, { sectionId, subsectionId, linkId }) => {
            queryClient.invalidateQueries({ queryKey: ['links', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['searchTrash'] })
        }
    })
}