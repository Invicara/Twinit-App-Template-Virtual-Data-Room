import { createContext, useContext, useState, useEffect } from 'react'

import { useGetMe } from '../services/useUsers'

import { logout } from '../auth/auth'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [roles, setRoles] = useState({})
  const { data, isLoading, error } = useGetMe()

  async function loadUser() {

      if (data) {
        setUser(data.user)
        setRoles(data.roles)
      }
      if (error) {
        console.error(error)
        logout()
      }
      
  }

  useEffect(() => {
    loadUser()
  }, [data, error])

  return (
    <UserContext.Provider value={{ user, roles, userLoading:isLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
