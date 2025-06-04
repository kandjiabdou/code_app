import axios from 'axios';

const API_URL = 'http://localhost:5500/api';

// Configuration d'Axios
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour gérer les erreurs
axiosInstance.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export const apiService = {
  // Applications
  async getAllApplications() {
    return axiosInstance.get('/applications');
  },

  async searchApplications(query) {
    return axiosInstance.get('/applications/search', {
      params: { q: query }
    });
  },

  async getApplicationComplete(applicationId) {
    return axiosInstance.get(`/applications/${applicationId}/complete`);
  },

  async createApplication(applicationData) {
    return axiosInstance.post('/applications', applicationData);
  },

  // Sous-applications
  async getAllSousApplications() {
    return axiosInstance.get('/sous-applications');
  },

  async getSousApplicationsByApplicationId(applicationId) {
    return axiosInstance.get(`/sous-applications/by-application/${applicationId}`);
  },

  async createSousApplication(sousApplicationData) {
    return axiosInstance.post('/sous-applications', sousApplicationData);
  },

  // Environnements
  async createEnvironnement(environnementData) {
    return axiosInstance.post('/environnements', environnementData);
  },

  async getEnvironnementById(id) {
    return axiosInstance.get(`/environnements/${id}`);
  },

  // Demandes
  async createDemande(demandeData) {
    return axiosInstance.post('/demandes', demandeData);
  },

  async getAllDemandes() {
    return axiosInstance.get('/demandes');
  },

  // Matrice de Flux
  async createMatriceFlux(matriceFluxData) {
    return axiosInstance.post('/matrice-flux', matriceFluxData);
  },

  async getMatriceFluxByEnvironnement(environnementId) {
    return axiosInstance.get(`/matrice-flux/environnement/${environnementId}`);
  }
}; 