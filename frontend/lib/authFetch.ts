import { API_URL } from "./api";

function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const request = (access: string | null) => fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
  });

  let response = await request(localStorage.getItem("access_token"));
  if (response.status !== 401) return response;

  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) {
    clearSession();
    return response;
  }

  const refreshResponse = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!refreshResponse.ok) {
    clearSession();
    return response;
  }

  const data = await refreshResponse.json();
  localStorage.setItem("access_token", data.access);
  response = await request(data.access);
  return response;
}
