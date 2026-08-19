import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useProject } from '../context/ProjectContext'
import { getAccessToken } from '../auth/auth'
import { apiFetch } from './apiFetch'

const _getSections = async (accessToken, namespace, trash) => {
    const url = new URL(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections`)
    if (trash !== undefined) url.searchParams.set('trash', trash)
    return apiFetch(url.toString(), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }).then(data => data._result.sections.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })))
}

export const useSections = ({ trash } = {}) => {

  const { project } = useProject()
  const accessToken = getAccessToken()

  return useQuery({
    queryKey: ['sections', project._namespaces[0], { trash }],
    queryFn: () => _getSections(accessToken, project._namespaces[0], trash),
    enabled: !!project && !!accessToken
  })
}

const _createSection = async (accessToken, namespace, sectionData) => {
  return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sectionData)
  })
}

export const useCreateSection = () => {

  const { project } = useProject()
  const accessToken = getAccessToken()
  const queryClient = useQueryClient()

  return useMutation({

    mutationFn: (sectionData) => _createSection(accessToken, project._namespaces[0], sectionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] })
    }

  })

}

const _updateSection = async (accessToken, namespace, sectionData) => {
  return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionData._id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sectionData)
  })
}

export const useUpdateSection = () => {

  const { project } = useProject()
  const accessToken = getAccessToken()
  const queryClient = useQueryClient()

  return useMutation({

    mutationFn: (sectionData) => _updateSection(accessToken, project._namespaces[0], sectionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] })
    }
  })

}

const _trashSection = async (accessToken, namespace, sectionId) => {
  return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/trash`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
}

export const useTrashSection = () => {

  const { project } = useProject()
  const accessToken = getAccessToken()
  const queryClient = useQueryClient()

  return useMutation({

    mutationFn: (sectionId) => _trashSection(accessToken, project._namespaces[0], sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] })
    }
  })

}

const _untrashSection = async (accessToken, namespace, sectionId) => {
  return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}/untrash`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
}

export const useUntrashSection = () => {

  const { project } = useProject()
  const accessToken = getAccessToken()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sectionId) => _untrashSection(accessToken, project._namespaces[0], sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      queryClient.invalidateQueries({ queryKey: ['searchTrash'] })
    }
  })

}

const _deleteSection = async (accessToken, namespace, sectionId) => {
  return apiFetch(`${import.meta.env.VITE_TWINIT_API}/omapi/${namespace}/sections/${sectionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
}

export const useDeleteSection = () => {
  const { project } = useProject()
  const accessToken = getAccessToken()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sectionId) => _deleteSection(accessToken, project._namespaces[0], sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      queryClient.invalidateQueries({ queryKey: ['searchTrash'] })
    }
  })
}