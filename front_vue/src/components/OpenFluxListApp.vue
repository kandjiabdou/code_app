<template>
  <v-container fluid>
    <v-card-title bg-color="primary">Liste des applications :</v-card-title>
    <v-row>
      <!-- Treeview Section -->
      <v-col cols="4">
        <v-treeview
          :items="formattedApplications"
          :selected="selection"
          @update:selected="selection = $event"
          item-value="id"
          item-title="title"
          item-children="children"
          color="info"
          return-object
          dense
          open-on-click
          hoverable
        >
          <template v-slot:prepend="{ item }">
            <v-icon v-if="!item.children?.length">mdi-checkbox-blank-circle-outline</v-icon>
            <v-icon v-else>mdi-folder</v-icon>
          </template>
        </v-treeview>
      </v-col>
      <!-- Details Section -->
      <v-col cols="8">
        <v-card v-if="selectedItem" class="pa-5">
          <v-card-title>Détails de l'Environnement</v-card-title>
          <v-card-text>
            <p>
              <strong>Application : </strong>
              {{ selectedItem.applicationNom }}
            </p>
            <p v-if="selectedItem.sousApplicationNom">
              <strong>Sous-application : </strong>
              {{ selectedItem.sousApplicationNom }}
            </p>
            <p>
              <strong>Type Environnement : </strong>
              {{ selectedItem.typeEnvironnement }}
            </p>
            <p>
              <strong>ID Ouverture : </strong>
              {{ selectedItem.idOuvertureEnv }}
            </p>
            <p>
              <strong>Version : </strong>
              {{ selectedItem.versions?.[0]?.numeroVersion || '-' }}
            </p>
            <p>
              <strong>Utilisateur créateur : </strong>
              {{ selectedItem.versions?.[0]?.utilisateurCreateur || '-' }}
            </p>
            <p>
              <strong>Date de création : </strong>
              {{ formatDate(selectedItem.versions?.[0]?.dateVersion) }}
            </p>
            <p>
              <strong>Dernière demande : </strong>
              {{ selectedItem.demandes?.[0]?.nomDemande || '-' }}
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
          <v-card-text>Sélectionner un environnement</v-card-text>
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
      return this.selection[0];
    },
    formattedApplications() {
      return this.applications.map(app => {
        let children = [];
        
        // Si l'application a des sous-applications
        if (app.hasSousApp && app.sousApplications) {
          children = app.sousApplications.map(sousApp => ({
            id: `sous_${sousApp.id}`,
            title: sousApp.nomSousApplication,
            children: sousApp.environnements?.map(env => ({
              id: `env_${env.id}`,
              title: `${env.typeEnvironnement} - ${env.idOuvertureEnv}`,
              applicationNom: app.nomApplication,
              sousApplicationNom: sousApp.nomSousApplication,
              ...env
            })) || []
          }));
        }
        // Si l'application n'a pas de sous-applications mais a des environnements directs
        else if (app.environnements) {
          children = app.environnements.map(env => ({
            id: `env_${env.id}`,
            title: `${env.typeEnvironnement} - ${env.idOuvertureEnv}`,
            applicationNom: app.nomApplication,
            ...env
          }));
        }

        return {
          id: `app_${app.id}`,
          title: app.nomApplication,
          children: children
        };
      });
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleString('fr-FR');
    },
    async fetchApplications() {
      try {
        this.loading = true;
        this.applications = await apiService.getAllApplications();
        console.log('Applications chargées:', this.applications);
      } catch (error) {
        console.error('Erreur lors de la récupération des applications:', error);
      } finally {
        this.loading = false;
      }
    },
    viewDetails() {
      if (this.selectedItem) {
        const envId = this.selectedItem.id.replace('env_', '');
        this.$router.push(`/environnement/${envId}`);
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
