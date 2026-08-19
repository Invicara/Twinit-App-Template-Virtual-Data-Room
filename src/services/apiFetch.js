export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired')
    this.name = 'SessionExpiredError'
  }
}

export const authEvents = new EventTarget()

export const apiFetch = async (url, options) => {
  const response = await fetch(url, options)

  if (response.ok) {
    const data = await response.json()
    if (data?.errorResult?.status === 401) {
      authEvents.dispatchEvent(new Event('session-expired'))
      throw new SessionExpiredError()
    }
    return data
  } else {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
}
