import axios from "axios";

export const instance = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
