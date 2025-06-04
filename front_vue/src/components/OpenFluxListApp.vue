<template>
  <v-container fluid>
    <v-card-title bg-color="primary">Liste des applications :</v-card-title>
    <v-row>
      <!-- Treeview Section -->
      <v-col cols="4">
        <v-text-field 
          v-model="search" 
          label="Rechercher" 
          prepend-icon="mdi-magnify"
          clearable
          placeholder="Rechercher une application ou sous-application..."
        ></v-text-field>
        <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>
        <v-treeview
          v-else
          :selected="selection"
          @update:selected="updateSelection"
          :items="applicationsTreeview"
          item-value="id"
          color="info"
          selectable
          selection-type="leaf"
          dense
        ></v-treeview>
      </v-col>
      <!-- Details Section -->
      <v-col cols="8">
        <v-card v-if="selectedItem" class="pa-5">
          <v-card-title>Détails de l'Environnement</v-card-title>
          <v-card-text>
            <p>
              <strong>Nom de l'Application : </strong>
              {{ selectedItem.nomApplication }}
            </p>
            <p v-if="selectedItem.nomSousApplication">
              <strong>Sous-application : </strong>
              {{ selectedItem.nomSousApplication }}
            </p>
            <p>
              <strong>Nom Ressource Cloud : </strong>
              {{ selectedItem.nomRessourceCloud }}
            </p>
            <p>
              <strong>Environnement : </strong>
              {{ selectedItem.typeEnvironnement }}
            </p>
            <p>
              <strong>Nom de la demande : </strong>
              {{ selectedItem.nomDemande }}
            </p>
            <p>
              <strong>Propriétaire : </strong>
              {{ selectedItem.proprietaire }}
            </p>
            <p>
              <strong>Date de création : </strong>
              {{ formatDate(selectedItem.dateCreation) }}
            </p>
            <p>
              <strong>Version : </strong>
              {{ selectedItem.numeroVersion ? `v${selectedItem.numeroVersion}` : '-' }}
            </p>
          </v-card-text>
          <v-row>
            <v-col cols="auto">
              <v-btn color="info" @click="editEnvironnement"> EDIT </v-btn>
            </v-col>
          </v-row>
        </v-card>
        <v-card v-else>
          <v-card-text> Sélectionner un environnement </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog d'édition d'environnement -->
    <EnvironnementEditDialog
      v-model="editDialog.show"
      :environnement-data="editDialog.environnementData"
      @environment-updated="onEnvironmentUpdated"
    />
  </v-container>
</template>

<script>
import { apiService } from '@/services/api.service';
import EnvironnementEditDialog from './EnvironnementEditDialog.vue';

export default {
  name: "OpenFluxListApp",
  components: {
    EnvironnementEditDialog
  },
  data() {
    return {
      applicationsTreeview: [],
      selection: [],
      search: '',
      loading: false,
      environmentsMap: new Map(), // Pour stocker les détails des environnements
      searchTimeout: null, // Pour le debounce de la recherche
      editDialog: {
        show: false,
        environnementData: null
      },
    };
  },
  
  computed: {
    selectedItem() {
      if (this.selection.length === 0) return null;
      const selectedId = this.selection[0];
      console.log('Selected ID:', selectedId);
      console.log('Environment details:', this.environmentsMap.get(selectedId));
      return this.environmentsMap.get(selectedId) || null;
    },
  },
  
  watch: {
    selection: {
      handler(newSelection) {
        console.log('Selection changed:', newSelection);
      },
      deep: true
    },
    search: {
      handler(newValue) {
        // Debounce la recherche pour éviter trop d'appels API
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
        }
        
        this.searchTimeout = setTimeout(() => {
          this.fetchApplications(newValue);
        }, 300); // Attendre 300ms après la dernière frappe
      }
    }
  },
  
  methods: {
    updateSelection(newSelection) {
      this.selection = newSelection;
    },

    async fetchApplications(searchTerm = '') {
      try {
        this.loading = true;
        
        // Construire les paramètres de l'API
        const params = {};
        if (searchTerm && searchTerm.trim() !== '') {
          params.q = searchTerm.trim();
        }
        
        const apiData = await apiService.getAllApplications(params);
        this.applicationsTreeview = this.transformDataForTreeview(apiData);
        console.log('Applications chargées:', this.applicationsTreeview);
        
        // Réinitialiser la sélection si la recherche a changé
        if (searchTerm !== this.lastSearchTerm) {
          this.selection = [];
          this.lastSearchTerm = searchTerm;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des applications:', error);
        this.applicationsTreeview = [];
      } finally {
        this.loading = false;
      }
    },

    transformDataForTreeview(apiData) {
      const treeData = [];
      
      // Réinitialiser la map des environnements
      this.environmentsMap.clear();

      apiData.forEach(app => {
        const appNode = {
          id: `app_${app.id}`,
          title: app.nomApplication,
          children: []
        };

        if (app.hasSousApp && app.SousApplications && app.SousApplications.length > 0) {
          // Application avec sous-applications
          app.SousApplications.forEach(sousApp => {
            const sousAppNode = {
              id: `sousapp_${sousApp.id}`,
              title: sousApp.nomSousApplication,
              children: []
            };

            // Ajouter les environnements de la sous-application
            if (sousApp.Environnements && sousApp.Environnements.length > 0) {
              sousApp.Environnements.forEach(env => {
                const envId = `env_${env.id}`;
                const envNode = {
                  id: envId,
                  title: env.typeEnvironnement
                };

                // Stocker les détails de l'environnement
                const envDetails = {
                  nomApplication: app.nomApplication,
                  nomSousApplication: sousApp.nomSousApplication,
                  nomRessourceCloud: app.nomRessourceCloud,
                  typeEnvironnement: env.typeEnvironnement,
                  nomDemande: env.Demandes && env.Demandes.length > 0 ? env.Demandes[0].nomDemande : '-',
                  proprietaire: env.Demandes && env.Demandes.length > 0 ? env.Demandes[0].proprietaire : '-',
                  dateCreation: env.Demandes && env.Demandes.length > 0 ? env.Demandes[0].dateCreation : null,
                  numeroVersion: env.VersionEnvironnements && env.VersionEnvironnements.length > 0 ? env.VersionEnvironnements[0].numeroVersion : null
                };

                this.environmentsMap.set(envId, envDetails);
                sousAppNode.children.push(envNode);
              });
            }

            appNode.children.push(sousAppNode);
          });
        } else if (app.Environnements && app.Environnements.length > 0) {
          // Application sans sous-applications mais avec environnements
          app.Environnements.forEach(env => {
            const envId = `env_${env.id}`;
            const envNode = {
              id: envId,
              title: env.typeEnvironnement
            };

            // Stocker les détails de l'environnement
            const envDetails = {
              nomApplication: app.nomApplication,
              nomSousApplication: null,
              nomRessourceCloud: app.nomRessourceCloud,
              typeEnvironnement: env.typeEnvironnement,
              nomDemande: env.Demandes && env.Demandes.length > 0 ? env.Demandes[0].nomDemande : '-',
              proprietaire: env.Demandes && env.Demandes.length > 0 ? env.Demandes[0].proprietaire : '-',
              dateCreation: env.Demandes && env.Demandes.length > 0 ? env.Demandes[0].dateCreation : null,
              numeroVersion: env.VersionEnvironnements && env.VersionEnvironnements.length > 0 ? env.VersionEnvironnements[0].numeroVersion : null
            };

            this.environmentsMap.set(envId, envDetails);
            appNode.children.push(envNode);
          });
        }

        // Ajouter l'application seulement si elle a des enfants (environnements)
        if (appNode.children.length > 0) {
          treeData.push(appNode);
        }
      });

      return treeData;
    },

    formatDate(dateString) {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (error) {
        return '-';
      }
    },

    async editEnvironnement() {
      if (!this.selection.length) {
        this.showSnackbar('Aucun environnement sélectionné pour l\'édition', 'warning');
        return;
      }

      if (this.selection.length > 1) {
        this.showSnackbar('Veuillez sélectionner un seul environnement pour l\'édition', 'warning');
        return;
      }

      // Vérifier que c'est bien un environnement qui est sélectionné
      const selectedId = this.selection[0];
      if (!selectedId.startsWith('env_')) {
        this.showSnackbar('Veuillez sélectionner un environnement (pas une application ou sous-application)', 'warning');
        return;
      }

      try {
        this.loading = true;
        
        // Extraire l'ID de l'environnement (enlever le préfixe 'env_')
        const environnementId = selectedId.replace('env_', '');
        const environnementComplet = await apiService.getEnvironnementById(environnementId);
        
        // Ouvrir le dialogue d'édition
        this.editDialog.environnementData = environnementComplet;
        this.editDialog.show = true;
        
      } catch (error) {
        console.error('Erreur lors du chargement de l\'environnement:', error);
        this.showSnackbar('Erreur lors du chargement de l\'environnement', 'error');
      } finally {
        this.loading = false;
      }
    },

    onEnvironmentUpdated() {
      // Mettre à jour la liste des applications
      this.fetchApplications();
      this.selection = [];
      this.showSnackbar('Environnement mis à jour avec succès !', 'success');
    },

    showSnackbar(text, color) {
      // Pour l'instant, on utilise console.log, mais on peut ajouter un vrai snackbar plus tard
      console.log(`Snackbar: ${text}`, color);
    }
  },

  async created() {
    await this.fetchApplications();
  },
  
  beforeUnmount() {
    // Nettoyer le timeout si le composant est détruit
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
};
</script>

<style scoped>
.v-card {
  max-width: 600px;
}
</style>