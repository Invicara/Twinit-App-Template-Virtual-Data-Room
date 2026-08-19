import { useQuery } from '@tanstack/react-query'
import { useProject } from '../context/ProjectContext'
import { getAccessToken } from '../auth/auth'
import { apiFetch } from './apiFetch'

const _search = async (accessToken, namespace, query, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const url = `${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/search${qs ? `?${qs}` : ''}`
    return apiFetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    }).then(data => data._result.searchResults)
}

export const useSearch = (query, params = {}) => {
    const { project } = useProject()
    const accessToken = getAccessToken()

    const hasParams = Object.keys(params).length > 0

    return useQuery({
        queryKey: ['search', project._namespaces[0], query, params],
        queryFn: () => _search(accessToken, project._namespaces[0], query, params),
        enabled: !!project && !!accessToken && (!!query?.trim() || hasParams)
    })
}

const _searchTrash = async (accessToken, namespace) => {
    const url = `${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/search/trash`
    return apiFetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.searchResults)
}

export const useTrash = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({
        queryKey: ['searchTrash', project._namespaces[0]],
        queryFn: () => _searchTrash(accessToken, project._namespaces[0]),
        enabled: !!project && !!accessToken
    })
}