<template>
  <v-container fluid>
    <v-card-title bg-color="primary">Liste des applications :</v-card-title>
    <v-row>
      <!-- Treeview Section -->
      <v-col cols="4">
        <v-treeview
          :selected="selection"
          @update:selected="selection = $event"
          :items="formattedApplications"
          item-value="id"
          color="info"
          return-object
          dense
          :loading="loading"
        ></v-treeview>
      </v-col>
      <!-- Details Section -->
      <v-col cols="8">
        <v-card v-if="selectedItem && selectedItem.env" class="pa-5">
          <v-card-title>Détails de l'Environnement</v-card-title>
          <v-card-text>
            <p>
              <strong>Nom Application dans VISTA : </strong>
              {{ selectedItem.parent_title || selectedItem.app_name }}
            </p>
            <p>
              <strong>Nom Ressource Cloud VISTA : </strong>
              {{ selectedItem.cloud_name }}
            </p>
            <p v-if="selectedItem.sub_app_name">
              <strong>Sous-application : </strong>
              {{ selectedItem.sub_app_name }}
            </p>
            <p><strong>Environnement : </strong>{{ selectedItem.env }}</p>
            <p><strong>ID Ouverture : </strong>{{ selectedItem.idOuvertureEnv || '-' }}</p>
            <p><strong>Version : </strong>{{ selectedItem.version || "-" }}</p>
            <p>
              <strong>Utilisateur propriétaire : </strong>
              {{ selectedItem.owner || '-' }}
            </p>
            <p>
              <strong>Date de demande : </strong>
              {{ selectedItem.requestDate || '-' }}
            </p>
            <p>
              <strong>Dernière demande : </strong>
              {{ selectedItem.nomDemande || '-' }}
            </p>
          </v-card-text>
          <v-row>
            <v-col cols="auto">
              <v-btn color="info" @click="viewDetails">
                VOIR DÉTAILS
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
        <v-card v-else>
          <v-card-text>Sélectionner un environnement pour voir les détails</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { apiService } from '@/services/api.service';

export default {
  name: "OpenFluxListApp",
  data() {
    return {
      applications: [],
      selection: [],
      loading: false
    };
  },
  computed: {
    selectedItem() {
      const id = this.selection[0];
      return id;
    },
    formattedApplications() {
      return this.applications.map(app => this.formatApplication(app));
    }
  },
  methods: {
    formatApplication(app) {
      let children = [];
      
      // Si l'application a des sous-applications
      if (app.hasSousApp && app.sousApplications && app.sousApplications.length > 0) {
        children = app.sousApplications.map(sousApp => ({
          id: `sous_${sousApp.id}`,
          title: sousApp.nomSousApplication,
          name: sousApp.nomSousApplication,
          is_parent: false,
          parent_id: app.id,
          app_name: app.nomApplication,
          cloud_name: app.nomRessourceCloud,
          sub_app_name: sousApp.nomSousApplication,
          children: (sousApp.environnements || []).map(env => ({
            id: `env_${env.id}`,
            title: env.typeEnvironnement,
            env: env.typeEnvironnement,
            idOuvertureEnv: env.idOuvertureEnv,
            version: env.versions?.[0]?.numeroVersion || env.VersionEnvironnements?.[0]?.numeroVersion || null,
            owner: env.demandes?.[0]?.proprietaire || env.Demandes?.[0]?.proprietaire || null,
            requestDate: this.formatDate(env.versions?.[0]?.dateVersion || env.VersionEnvironnements?.[0]?.dateVersion),
            nomDemande: env.demandes?.[0]?.nomDemande || env.Demandes?.[0]?.nomDemande || null,
            parent_title: app.nomApplication,
            app_name: app.nomApplication,
            cloud_name: app.nomRessourceCloud,
            sub_app_name: sousApp.nomSousApplication,
            environnementId: env.id
          }))
        }));
      }
      // Si l'application n'a pas de sous-applications mais a des environnements directs
      else if (app.environnements && app.environnements.length > 0) {
        children = app.environnements.map(env => ({
          id: `env_${env.id}`,
          title: env.typeEnvironnement,
          env: env.typeEnvironnement,
          idOuvertureEnv: env.idOuvertureEnv,
          version: env.versions?.[0]?.numeroVersion || env.VersionEnvironnements?.[0]?.numeroVersion || null,
          owner: env.demandes?.[0]?.proprietaire || env.Demandes?.[0]?.proprietaire || null,
          requestDate: this.formatDate(env.versions?.[0]?.dateVersion || env.VersionEnvironnements?.[0]?.dateVersion),
          nomDemande: env.demandes?.[0]?.nomDemande || env.Demandes?.[0]?.nomDemande || null,
          parent_title: app.nomApplication,
          app_name: app.nomApplication,
          cloud_name: app.nomRessourceCloud,
          sub_app_name: null,
          environnementId: env.id
        }));
      }

      return {
        id: `app_${app.id}`,
        title: app.nomApplication,
        name: app.nomApplication,
        is_parent: app.hasSousApp,
        parent_id: null,
        app_name: app.nomApplication,
        cloud_name: app.nomRessourceCloud,
        children: children
      };
    },
    
    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('fr-FR');
    },
    
    async fetchApplications() {
      try {
        this.loading = true;
        this.applications = await apiService.getAllApplications();
        console.log('Applications chargées:', this.applications);
      } catch (error) {
        console.error('Erreur lors de la récupération des applications:', error);
        // En cas d'erreur, on peut utiliser des données de démonstration
        this.applications = [];
      } finally {
        this.loading = false;
      }
    },
    
    viewDetails() {
      if (this.selectedItem && this.selectedItem.environnementId) {
        // Naviguer vers la page de détails de l'environnement
        this.$router.push(`/environnement/${this.selectedItem.environnementId}`);
      }
    }
  },
  
  async created() {
    await this.fetchApplications();
  }
};
</script>

<style scoped>
.v-card {
  max-width: 600px;
}
.v-treeview {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
}
</style>
