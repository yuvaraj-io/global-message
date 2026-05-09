import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const api = axios.create({
  baseURL: `${API_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("global-space-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) return error.response?.data?.message || error.message;
  return error instanceof Error ? error.message : "Something went wrong";
};
