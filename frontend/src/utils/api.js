import axios from 'axios';

// Config URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. LE POSTIER : Attacher le badge (token) AVANT d'envoyer la requête
api.interceptors.request.use(
  (config) => {
    // On récupère le token
    const token = localStorage.getItem('tipsy_token');
    
    // Si on l'a, on l'ajoute dans l'en-tête (header)
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. LE VIDEUR : Gérer les expulsions (Erreur 401) QUAND le serveur répond
api.interceptors.response.use(
  (response) => {
    // Si tout va bien, on laisse passer
    return response;
  },
  (error) => {
    // Si le serveur ne répond pas (401 = Non autorisé / Token expiré)
    if (error.response && error.response.status === 401) {
      console.warn("Session expirée, déconnexion...");
      // On vide tout pour éviter les bugs
      localStorage.removeItem('tipsy_token');
      sessionStorage.clear();
      // On redirige vers la page de connexion
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;