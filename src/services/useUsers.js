import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useProject } from '../context/ProjectContext'
import { getAccessToken } from '../auth/auth'
import { apiFetch } from './apiFetch'

const _getMe = async (accessToken, namespace) => {
    const url = `${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/users/me`
    return apiFetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => { return { user: data._result.data.user, roles: data._result.data.roles } })
}

export const useGetMe = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({
        queryKey: ['users', 'me'],
        queryFn: () => _getMe(accessToken, project._namespaces[0]),
        enabled: !!project && !!accessToken,
        staleTime: 1000 * 60 * 60 // 60 minutes
    })
}

const _getAllUsers = async (accessToken, namespace) => {
    const url = `${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/users`
    return apiFetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.users)
}

export const useGetAllUsers = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({
        queryKey: ['users', 'all'],
        queryFn: () => _getAllUsers(accessToken, project._namespaces[0]),
        enabled: !!project && !!accessToken,
        staleTime: 1000 * 60 * 5 // 5 minutes
    })
}

const _getUserGroups = async (accessToken, namespace) => {
    const url = `${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/users/groups`
    return apiFetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.groups)
}

export const useUserGroups = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({
        queryKey: ['users', 'groups'],
        queryFn: () => _getUserGroups(accessToken, project._namespaces[0]),
        enabled: !!project && !!accessToken
    })
}

const _getGroupUsers = async (accessToken, namespace, groupid) => {
    const url = `${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/users/groups/${groupid}/users`
    return apiFetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.users)
}

export const useGroupUsers = (groupid) => {
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useQuery({
        queryKey: ['users', 'groups', groupid, 'users'],
        queryFn: () => _getGroupUsers(accessToken, project._namespaces[0], groupid),
        enabled: !!project && !!accessToken && !!groupid
    })
}

const _inviteUsers = async (accessToken, namespace, payload) => {
    const url = `${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/users/invite`
    return apiFetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(data => data._result)
}

export const useInviteUsers = () => {
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useMutation({
        mutationFn: (payload) => _inviteUsers(accessToken, project._namespaces[0], payload),
    })
}

const _removeUserFromGroup = async (accessToken, namespace, groupId, userId) => {
    const url = `${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/users/groups/${encodeURIComponent(groupId)}/users/${encodeURIComponent(userId)}`
    return apiFetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => {
        const r = data._result
        if (r?.statusCode != null && r.statusCode !== 200) {
            throw new Error(r.message || 'Remove user failed')
        }
        return r
    })
}

export const useRemoveUserFromGroup = () => {
    const queryClient = useQueryClient()
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useMutation({
        mutationFn: ({ groupId, userId }) =>
            _removeUserFromGroup(accessToken, project._namespaces[0], groupId, userId),
        onSuccess: (_data, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['users', 'groups', groupId, 'users'] })
        }
    })
}

const _removeUserFromAllGroups = async (accessToken, namespace, userId) => {
    const url = `${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/users/${encodeURIComponent(userId)}/groups`
    return apiFetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => {
        const r = data._result
        if (r?.statusCode != null && r.statusCode !== 200) {
            throw new Error(r.message || 'Remove user from all groups failed')
        }
        return r
    })
}

const _cancelInvite = async (accessToken, namespace, groupId, inviteId) => {
    const url = `${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/users/groups/${encodeURIComponent(groupId)}/invites/${encodeURIComponent(inviteId)}`
    return apiFetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => {
        const r = data._result
        if (r?.statusCode != null && r.statusCode !== 200) {
            throw new Error(r.message || 'Cancel invite failed')
        }
        return r
    })
}

export const useCancelInvite = () => {
    const queryClient = useQueryClient()
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useMutation({
        mutationFn: ({ groupId, inviteId }) =>
            _cancelInvite(accessToken, project._namespaces[0], groupId, inviteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'groups'] })
        }
    })
}

export const useRemoveUserFromAllGroups = () => {
    const queryClient = useQueryClient()
    const { project } = useProject()
    const accessToken = getAccessToken()

    return useMutation({
        mutationFn: ({ userId }) =>
            _removeUserFromAllGroups(accessToken, project._namespaces[0], userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'groups'] })
        }
    })
}