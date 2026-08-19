import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useProject } from '../context/ProjectContext'
import { useUser } from '../context/UserContext'
import { getAccessToken } from '../auth/auth'
import { apiFetch } from './apiFetch'
import { IafFileSvc } from '@dtplatform/platform-api'

const _getDocuments = async (accessToken, namespace, sectionId, subsectionId) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/subsections/${subsectionId}/documents`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(data => data._result.documents.sort((a, b) => a._name.localeCompare(b._name)))
}

export const useDocuments = (sectionId, subsectionId, { enabled = true } = {}) => {

    const { project } = useProject()
    const accessToken = getAccessToken()
  
    return useQuery({
      queryKey: ['documents', project._namespaces[0], sectionId, subsectionId],
      queryFn: () =>_getDocuments(accessToken, project._namespaces[0], sectionId, subsectionId),
      enabled: enabled && !!project && !!accessToken && !!sectionId && !!subsectionId
    })

}

const _getDocumentStatuses = async (accessToken, namespace) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/documents/statuses`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.statuses)
}

export const useDocumentStatuses = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    return useQuery({
        queryKey: ['documentStatuses', project._namespaces[0]],
        queryFn: () => _getDocumentStatuses(accessToken, project._namespaces[0]),
        enabled: !!project && !!accessToken,
        staleTime: Infinity
    })
}

const _getDocumentLogs = async (accessToken, namespace, fileid, versionid) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/documents/${fileid}/versions/${versionid}/logs`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(data => data._result.logs)
}

export const useDocumentLogs = (fileid, versionid) => {

    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({
        queryKey: ['documentLogs', project._namespaces[0], fileid, versionid],
        queryFn: () => _getDocumentLogs(accessToken, project._namespaces[0], fileid, versionid),
        enabled: !!project && !!accessToken && !!fileid && !!versionid
    })

}

const _postProcessDocument = async (accessToken, namespace, uploadedDocument) => {

    apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/documents/${uploadedDocument._id}/versions/${uploadedDocument._tipId}/vectorize`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: `${uploadedDocument._name.split('.').pop()}`, name: `${uploadedDocument._name.split('.').splice(0,-1).join('.')}`, userType: `${uploadedDocument._name.split('.').splice(0,-1).join('.')}_${namespace}` })
    }).catch(error => {
        console.error('Error vectorizing document', error)
    })

    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/documents/${uploadedDocument._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'For Review', message: 'Document uploaded'})
    })
}

async function _withConcurrency(items, concurrency, fn) {
    const executing = new Set()
    const results = []

    for (const item of items) {
        const promise = fn(item).then(result => {
            executing.delete(promise)
            return result
        })
        executing.add(promise)
        results.push(promise)

        if (executing.size >= concurrency) {
            await Promise.race(executing)
        }
    }

    return Promise.all(results)
}

const _uploadDocuments = async (accessToken, namespace, folderId, documents, onFileComplete) => {

    function uploadOne(file) {
        return new Promise((resolve, reject) => {
            try {
                console.log('Uploading document', file.name)
                IafFileSvc.addFileResumable(file, [namespace], [folderId], [], null, {
                    filename: file.name,
                    onProgress: (bytesUploaded, bytesTotal) => {
                        const pct = (bytesUploaded / bytesTotal * 100).toFixed(1)
                        console.log(`${file.name}: ${pct}%`)
                    },
                    onComplete: async (uploaded) => {
                        console.log(`${uploaded._name} COMPLETE`)
                        await _postProcessDocument(accessToken, namespace, uploaded)
                        onFileComplete?.()
                        resolve(uploaded)
                    },
                    onError: (error) => {
                        console.log(`${file.name}: ERROR`, error)
                        reject(error)
                    }
                })
            } catch (e) {
                console.log(e)
                reject(e)
            }
        })
    }

    return _withConcurrency(Array.from(documents), 3, uploadOne)

}

export const useUploadDocuments = (sectionId, subsectionId, folderId) => {

    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ files, onFileComplete }) =>
            _uploadDocuments(accessToken, project._namespaces[0], folderId, files, onFileComplete),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['documents', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId] })
            data.forEach(uploadedFile => {
                queryClient.invalidateQueries({ queryKey: ['documentVersions', uploadedFile._id] })
            })
        },
        onError: (error) => {
            console.error('Error uploading documents', error)
        }
    })
}

const _updateDocumentStatus = async (accessToken, namespace, docId, status, note) => {
    const body = { status, message: `Status changed to ${status}` }
    if (note?.trim()) body.note = note.trim()
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/documents/${docId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
}

export const useUpdateDocumentStatus = (sectionId, subsectionId) => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ docId, status, note }) =>
            _updateDocumentStatus(accessToken, project._namespaces[0], docId, status, note),
        onSuccess: (data, variables ) => {
            queryClient.invalidateQueries({ queryKey: ['documents', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['documentVersions', variables.docId] })
        }
    })
}

const _getDocumentVersions = async (accessToken, namespace, fileid) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/documents/${fileid}/versions`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.versions.sort((a, b) => b._version - a._version))
}

export const useDocumentVersions = (fileId, { enabled = false } = {}) => {

    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({
        queryKey: ['documentVersions', fileId],
        queryFn: async () => {
            return _getDocumentVersions(accessToken, project._namespaces[0], fileId)
            
        },
        enabled: enabled && !!fileId
    })
}

const _trashDocument = async (accessToken, namespace, fileid) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/documents/${fileid}/trash`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
}

export const useTrashDocument = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId, fileid }) => _trashDocument(accessToken, project._namespaces[0], fileid),
        onSuccess: (data, { sectionId, subsectionId, fileid }) => {
            queryClient.invalidateQueries({ queryKey: ['documents', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['documentVersions', fileid] })
        }
    })
}

const _untrashDocument = async (accessToken, namespace, fileid) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/documents/${fileid}/untrash`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
}

export const useUntrashDocument = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId, fileid }) => _untrashDocument(accessToken, project._namespaces[0], fileid),
        onSuccess: (data, { sectionId, subsectionId, fileid }) => {
            queryClient.invalidateQueries({ queryKey: ['documents', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['documentVersions', fileid] })
            queryClient.invalidateQueries({ queryKey: ['searchTrash', project._namespaces[0]] })
        }
    })
}

const _deleteDocument = async (accessToken, namespace, fileid) => {
    return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/documents/${fileid}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
}

export const useDeleteDocument = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ sectionId, subsectionId, fileid }) => _deleteDocument(accessToken, project._namespaces[0], fileid),
        onSuccess: (data, { sectionId, subsectionId, fileid }) => {
            queryClient.invalidateQueries({ queryKey: ['documents', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['subsectionStatus', project._namespaces[0], sectionId, subsectionId] })
            queryClient.invalidateQueries({ queryKey: ['documentVersions', fileid] })
            queryClient.invalidateQueries({ queryKey: ['searchTrash', project._namespaces[0]] })
        }
    })
}