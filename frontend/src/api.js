// Central API configuration.
// In production, Vercel can inject VITE_API_BASE_URL to point to a hosted backend.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export default API_BASE;
