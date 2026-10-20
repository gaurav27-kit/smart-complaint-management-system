import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Auth endpoints where 401 is expected (e.g. wrong credentials) and shouldn't trigger automatic redirect
const AUTH_BYPASS_URLS = ["/auth/login", "/auth/register", "/auth/google"];

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const message = (error.response?.data?.message || "").toLowerCase();

    const isAuthBypass = AUTH_BYPASS_URLS.some((path) => url.includes(path));
    const isDeactivated = status === 403 && (message.includes("deactivate") || message.includes("inactive"));

    if (!isAuthBypass && (status === 401 || isDeactivated)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.dispatchEvent(new CustomEvent("auth:unauthorized"));

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;