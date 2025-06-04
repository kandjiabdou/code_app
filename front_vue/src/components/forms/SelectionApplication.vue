<template>
  <v-card class="pa-2 mb-3" outlined>
    <v-card-title class="text-h6">Application</v-card-title>
    <v-row dense>
      <v-col cols="12" md="6">
        <v-autocomplete
          v-model="selectedApplication"
          :items="applicationsSearch"
          :search="searchTerm"
          @update:search="onSearchUpdate"
          :loading="searchLoading"
          item-title="nomApplication"
          item-value="id"
          label="Rechercher et sélectionner une application *"
          :rules="readOnly ? [] : requiredRules"
          dense
          hide-details="auto"
          rounded
          variant="outlined"
          clearable
          @update:model-value="onApplicationSelected"
          :disabled="readOnly"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props">
              <v-list-item-title>{{ item.raw.nomApplication }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.raw.nomRessourceCloud }}</v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-autocomplete>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field 
          v-model="localData.nomRessourceCloud" 
          label="Nom Ressource Cloud VISTA" 
          dense 
          hide-details="auto" 
          rounded 
          variant="outlined"
          disabled
          bg-color="grey-lighten-3"
        />
      </v-col>
    </v-row>
    <v-row dense v-if="selectedApplicationData">
      <v-col cols="12" md="6" v-if="selectedApplicationData.hasSousApp && selectedApplicationData.sousApplications?.length > 0">
        <v-select
          v-model="selectedSousApplication"
          :items="selectedApplicationData.sousApplications"
          item-title="nomSousApplication"
          item-value="id"
          label="Sous-application"
          dense
          hide-details="auto"
          rounded
          variant="outlined"
          clearable
          @update:model-value="onSousApplicationSelected"
          :disabled="readOnly"
        />
      </v-col>
      <v-col cols="12" :md="selectedApplicationData.hasSousApp ? 6 : 12">
        <v-select
          v-model="localData.environnement"
          :items="availableEnvironnements"
          label="Environnement à créer *"
          :rules="readOnly ? [] : requiredRules"
          dense
          hide-details="auto"
          rounded
          variant="outlined"
          :disabled="readOnly || !availableEnvironnements.length"
          :hint="!availableEnvironnements.length ? 'Tous les environnements existent déjà' : `${availableEnvironnements.length} environnement(s) disponible(s)`"
          persistent-hint
          @update:model-value="updateData"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import { apiService } from '@/services/api.service';

export default {
  name: 'SelectionApplication',
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        nomApplication: '',
        nomRessourceCloud: '',
        nomSousApplication: '',
        environnement: ''
      })
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    prefilledApplication: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'application-selected'],
  data() {
    return {
      localData: { ...this.modelValue },
      selectedApplication: null,
      selectedApplicationData: null,
      searchTerm: '',
      searchLoading: false,
      applicationsSearch: [],
      selectedSousApplication: null,
      availableEnvironnements: [],
      searchTimeout: null,
      requiredRules: [v => !!v || 'Ce champ est obligatoire']
    };
  },
  watch: {
    modelValue: {
      handler(newVal) {
        this.localData = { ...newVal };
      },
      deep: true
    },
    prefilledApplication: {
      handler(app) {
        if (app && this.readOnly) {
          this.setupPrefilledData(app);
        }
      },
      immediate: true
    }
  },
  methods: {
    setupPrefilledData(app) {
      this.selectedApplicationData = app;
      this.selectedApplication = app.id;
      this.localData.nomApplication = app.nomApplication;
      this.localData.nomRessourceCloud = app.nomRessourceCloud;
      
      // Si il y a une sous-application préremplie
      if (app.selectedSousApplication) {
        this.selectedSousApplication = app.selectedSousApplication.id;
        this.localData.nomSousApplication = app.selectedSousApplication.nomSousApplication;
      }
      
      this.updateData();
    },
    
    onSearchUpdate(search) {
      if (this.readOnly) return;
      
      this.searchTerm = search;
      
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      this.searchTimeout = setTimeout(() => {
        if (this.searchTerm && this.searchTerm.trim() !== '') {
          this.fetchApplications();
        } else {
          this.applicationsSearch = [];
        }
      }, 300);
    },
    
    async fetchApplications() {
      if (!this.searchTerm || this.searchTerm.trim() === '') {
        this.applicationsSearch = [];
        return;
      }
      
      try {
        this.searchLoading = true;
        const applications = await apiService.searchApplications(this.searchTerm.trim());
        this.applicationsSearch = applications;
      } catch (error) {
        console.error('Erreur lors de la recherche d\'applications:', error);
        this.applicationsSearch = [];
      } finally {
        this.searchLoading = false;
      }
    },
    
    onApplicationSelected(applicationId) {
      if (this.readOnly) return;
      
      this.selectedApplication = applicationId;
      this.selectedSousApplication = null;
      this.localData.environnement = '';
      this.availableEnvironnements = [];
      
      if (applicationId) {
        this.selectedApplicationData = this.applicationsSearch.find(app => app.id === applicationId);
        
        if (this.selectedApplicationData) {
          this.localData.nomApplication = this.selectedApplicationData.nomApplication;
          this.localData.nomRessourceCloud = this.selectedApplicationData.nomRessourceCloud;
          this.localData.nomSousApplication = '';
          
          this.updateAvailableEnvironnements();
          this.$emit('application-selected', this.selectedApplicationData);
        }
      } else {
        this.selectedApplicationData = null;
        this.localData.nomApplication = '';
        this.localData.nomRessourceCloud = '';
        this.localData.nomSousApplication = '';
        this.$emit('application-selected', null);
      }
      
      this.updateData();
    },
    
    onSousApplicationSelected(sousAppId) {
      if (this.readOnly) return;
      
      this.selectedSousApplication = sousAppId;
      this.localData.environnement = '';
      
      if (sousAppId && this.selectedApplicationData) {
        const sousApp = this.selectedApplicationData.sousApplications.find(sa => sa.id === sousAppId);
        if (sousApp) {
          this.localData.nomSousApplication = sousApp.nomSousApplication;
          this.availableEnvironnements = sousApp.environnementsDisponibles;
        }
      } else {
        this.localData.nomSousApplication = '';
        this.updateAvailableEnvironnements();
      }
      
      this.updateData();
    },
    
    updateAvailableEnvironnements() {
      if (!this.selectedApplicationData) {
        this.availableEnvironnements = [];
        return;
      }
      
      if (this.selectedApplicationData.hasSousApp) {
        if (this.selectedSousApplication) {
          const sousApp = this.selectedApplicationData.sousApplications.find(sa => sa.id === this.selectedSousApplication);
          this.availableEnvironnements = sousApp ? sousApp.environnementsDisponibles : [];
        } else {
          this.availableEnvironnements = [];
        }
      } else {
        this.availableEnvironnements = this.selectedApplicationData.environnementsDisponibles || [];
      }
    },
    
    updateData() {
      this.$emit('update:modelValue', { ...this.localData });
    },
    
    getSelectedApplicationData() {
      return this.selectedApplicationData;
    },
    
    getSelectedSousApplication() {
      return this.selectedSousApplication;
    }
  },
  
  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
};
</script> 