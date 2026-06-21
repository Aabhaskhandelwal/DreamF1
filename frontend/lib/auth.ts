// Centralised auth-session helpers so token + username are stored consistently.

export function setSession(token: string, username?: string | null) {
  localStorage.setItem("token", token)
  if (username) localStorage.setItem("username", username)
}

export function clearSession() {
  localStorage.removeItem("token")
  localStorage.removeItem("username")
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function isLoggedIn(): boolean {
  return !!getToken()
}
