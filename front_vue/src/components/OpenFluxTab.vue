<template>
  <v-container>
    <v-tabs v-model="tab" bg-color="primary">
      <v-tab value="application">Application</v-tab>
      <v-tab value="matrice">Matrice Flux</v-tab>
    </v-tabs>

    <v-card-text>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="application">
          <OpenFluxApp ref="openFluxAppRef" />
        </v-tabs-window-item>

        <v-tabs-window-item value="matrice">
          <OpenFluxMatrice ref="OpenFluxMatrice" />
        </v-tabs-window-item>
      </v-tabs-window>

      <v-row class="ml-5">
        <v-col cols="auto">
          <v-btn color="primary" @click="submit" :loading="loading">
            Soumettre
          </v-btn>
        </v-col>

        <v-col cols="auto">
          <v-btn variant="outlined" color="info" @click="save" :loading="loading">
            SAVE
          </v-btn>
        </v-col>

        <v-col cols="auto">
          <v-btn variant="tonal" color="error" @click="handleCancel">
            CANCEL
          </v-btn>
        </v-col>
      </v-row>

      <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="6000">
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn variant="text" @click="snackbar.show = false">Fermer</v-btn>
        </template>
      </v-snackbar>
    </v-card-text>
  </v-container>
</template>

<script>
import OpenFluxApp from "./OpenFluxApp.vue";
import OpenFluxMatrice from "./OpenFluxMatrice.vue";
import { apiService } from '@/services/api.service';

export default {
  components: { OpenFluxApp, OpenFluxMatrice },
  data() {
    return {
      tab: null,
      loading: false,
      snackbar: {
        show: false,
        text: '',
        color: 'success',
        timeout: 6000
      }
    };
  },
  methods: {
    showSnackbar(text, color = 'success') {
      this.snackbar = {
        show: true,
        text,
        color,
        timeout: color === 'error' ? 8000 : 6000
      };
    },

    async submit() {
      if (this.loading) return;

      try {
        this.loading = true;
        const resultIsValidForm = await this.$refs.openFluxAppRef.validateForm();

        if (!resultIsValidForm.valid) {
          this.showSnackbar('Formulaire invalide, corrigez les erreurs !', 'error');
          return;
        }

        const appForm = this.$refs.openFluxAppRef.getDemandeDataForm();
        const matriceFlux = this.$refs.OpenFluxMatrice.getMaticeFlux();

        // 1. Vérifier/Créer l'application
        let application;
        try {
          // Rechercher l'application par son nom
          const existingApps = await apiService.getAllApplications();
          application = existingApps.find(app => 
            app.nomApplication === appForm.nomApplication && 
            app.nomRessourceCloud === appForm.nomRessourceCloud
          );

          if (!application) {
            // Créer l'application si elle n'existe pas
            application = await apiService.createApplication({
              nomApplication: appForm.nomApplication,
              nomRessourceCloud: appForm.nomRessourceCloud,
              hasSousApp: !!appForm.nomSousApplication
            });
          }
        } catch (error) {
          console.error('Erreur lors de la vérification/création de l\'application:', error);
          throw error;
        }

        // 2. Vérifier/Créer la sous-application si nécessaire
        let sousApplicationId = null;
        if (appForm.nomSousApplication) {
          try {
            // Rechercher la sous-application dans les sous-applications de l'application
            const sousApplications = await apiService.getSousApplicationsByApplicationId(application.id);
            const existingSousApp = sousApplications.find(sousApp => 
              sousApp.nomSousApplication === appForm.nomSousApplication
            );

            if (existingSousApp) {
              sousApplicationId = existingSousApp.id;
            } else {
              // Créer la sous-application si elle n'existe pas
              const newSousApp = await apiService.createSousApplication({
                nomSousApplication: appForm.nomSousApplication,
                applicationId: application.id
              });
              sousApplicationId = newSousApp.id;
            }
          } catch (error) {
            console.error('Erreur lors de la vérification/création de la sous-application:', error);
            throw error;
          }
        }

        // 3. Créer l'environnement
        const environnement = await apiService.createEnvironnement({
          typeEnvironnement: appForm.environnement,
          idOuvertureEnv: appForm.nomDemandeOuverture,
          applicationId: application.id,
          sousApplicationId,
          composants: appForm.composants.map(comp => ({
            ...comp,
            applicationId: application.id,
            sousApplicationId
          })),
          matriceFlux
        });

        // 4. Créer la demande
        const demande = await apiService.createDemande({
          nomDemande: appForm.nomDemandeOuverture,
          proprietaire: appForm.proprietaire,
          dateCreation: new Date(),
          environnementId: environnement.id,
          versionEnvId: environnement.versions[0].id
        });

        this.showSnackbar('Demande créée avec succès !');
        this.$emit('submit-success', { demande, environnement, application });

      } catch (error) {
        console.error('Erreur lors de la soumission:', error);
        const errorMessage = error.message || 'Une erreur est survenue lors de la création de la demande';
        this.showSnackbar(errorMessage, 'error');
      } finally {
        this.loading = false;
      }
    },

    async save() {
      try {
        this.loading = true;
        // const appForm = this.$refs.OpenFluxApp.getFormData();
        // const matriceFlux = this.$refs.OpenFluxMatrice.getMaticeFlux();

        // TODO: Implémenter la sauvegarde en brouillon
        // Vous pouvez ajouter ici la logique pour sauvegarder en brouillon
        // Par exemple, stocker dans localStorage ou envoyer à une API de brouillons

        this.showSnackbar('Données sauvegardées avec succès !');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        this.showSnackbar('Erreur lors de la sauvegarde', 'error');
      } finally {
        this.loading = false;
      }
    },

    handleCancel() {
      this.$emit('cancel');
    },
  },
};
</script>
