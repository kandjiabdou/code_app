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
    const response = await axios.get(`${API_URL}/applications`);
    return response.data;
  },

  async createApplication(applicationData) {
    const response = await axios.post(`${API_URL}/applications`, applicationData);
    return response.data;
  },

  // Sous-applications
  async getAllSousApplications() {
    const response = await axios.get(`${API_URL}/sous-applications`);
    return response.data;
  },

  async getSousApplicationsByApplicationId(applicationId) {
    const response = await axios.get(`${API_URL}/sous-applications/by-application/${applicationId}`);
    return response.data;
  },

  async createSousApplication(sousApplicationData) {
    const response = await axios.post(`${API_URL}/sous-applications`, sousApplicationData);
    return response.data;
  },

  // Environnements
  async createEnvironnement(environnementData) {
    const response = await axios.post(`${API_URL}/environnements`, environnementData);
    return response.data;
  },

  async getEnvironnementById(id) {
    return axiosInstance.get(`/environnements/${id}`);
  },

  // Demandes
  async createDemande(demandeData) {
    const response = await axios.post(`${API_URL}/demandes`, demandeData);
    return response.data;
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