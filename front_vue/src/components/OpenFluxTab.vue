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

      <v-snackbar 
        v-model="snackbar.show" 
        :color="snackbar.color" 
        :timeout="snackbar.timeout"
        location="top"
        multi-line
        :max-width="600"
      >
        <div style="white-space: pre-line; font-family: monospace;">
          {{ snackbar.text }}
        </div>
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
            typeComposantTiers: comp.type.toLowerCase(),
            nomComposant: comp.nomComposant,
            nomNetworkGroupVra: comp.nomNetworkGroupVRA,
            tiers: comp.tiers.map(tier => ({
              typeTier: tier.type,
              zoneSecurite: tier.zoneSecurite,
              optionVip: tier.optionVIP,
              groups: tier.groups
            })),
            applicationId: application.id,
            sousApplicationId
          })),
          matriceFlux: matriceFlux.map(flux => ({
            sourceZone: flux.sourceZone,
            sourceDesignation: flux.sourceDesignation,
            sourceGroupe: flux.sourceGroup,
            destZone: flux.destZone,
            destDesignation: flux.destDesignation,
            destGroupe: flux.destGroup,
            protocole: flux.protocol,
            port: flux.port,
            action: flux.action
          }))
        });

        // 4. Créer la demande
        // Trouver la version d'environnement (la plus récente créée)
        let versionEnvId = null;
        if (environnement.VersionEnvironnements && environnement.VersionEnvironnements.length > 0) {
          // Trier par numéro de version décroissant et prendre la première
          const latestVersion = environnement.VersionEnvironnements.sort((a, b) => b.numeroVersion - a.numeroVersion)[0];
          versionEnvId = latestVersion.id;
        } else {
          // Si pas de versions trouvées, essayer de récupérer l'environnement avec ses versions
          const envWithVersions = await apiService.getEnvironnementById(environnement.id);
          if (envWithVersions.VersionEnvironnements && envWithVersions.VersionEnvironnements.length > 0) {
            const latestVersion = envWithVersions.VersionEnvironnements.sort((a, b) => b.numeroVersion - a.numeroVersion)[0];
            versionEnvId = latestVersion.id;
          } else {
            throw new Error('Impossible de trouver une version pour cet environnement');
          }
        }

        const demande = await apiService.createDemande({
          nomDemande: appForm.nomDemandeOuverture,
          proprietaire: appForm.proprietaire,
          dateCreation: new Date(),
          environnementId: environnement.id,
          versionEnvId: versionEnvId
        });

        this.showSnackbar('Demande créée avec succès !');
        this.$emit('submit-success', { demande, environnement, application });

      } catch (error) {
        console.error('Erreur lors de la soumission:', error);
        
        // Gestion des erreurs avec messages explicites de l'API
        let errorMessage = 'Une erreur est survenue lors de la création de la demande';
        
        if (error.response?.data) {
          const errorData = error.response.data;
          
          // Erreurs métier avec codes spécifiques
          if (errorData.code) {
            switch (errorData.code) {
              case 'ENVIRONMENT_ALREADY_EXISTS':
                errorMessage = `❌ ${errorData.error}\n\n${errorData.details}`;
                if (errorData.existingEnvironment) {
                  errorMessage += `\n\n📋 Environnement existant :\n• ID: ${errorData.existingEnvironment.id}\n• Type: ${errorData.existingEnvironment.typeEnvironnement}\n• Application: ${errorData.existingEnvironment.application}`;
                  if (errorData.existingEnvironment.sousApplication) {
                    errorMessage += `\n• Sous-application: ${errorData.existingEnvironment.sousApplication}`;
                  }
                }
                break;
                
              case 'ID_OUVERTURE_ALREADY_EXISTS':
                errorMessage = `❌ ${errorData.error}\n\n${errorData.details}`;
                break;
                
              case 'APPLICATION_NOT_FOUND':
              case 'SOUS_APPLICATION_NOT_FOUND':
                errorMessage = `❌ ${errorData.error}\n\n${errorData.details}`;
                if (errorData.availableSousApplications && errorData.availableSousApplications.length > 0) {
                  errorMessage += `\n\n📋 Sous-applications disponibles :`;
                  errorData.availableSousApplications.forEach(sa => {
                    errorMessage += `\n• ${sa.nom} (ID: ${sa.id})`;
                  });
                }
                break;
                
              case 'SOUS_APPLICATION_REQUIRED':
                errorMessage = `⚠️ ${errorData.error}\n\n${errorData.details}`;
                if (errorData.availableSousApplications && errorData.availableSousApplications.length > 0) {
                  errorMessage += `\n\n📋 Sous-applications disponibles :`;
                  errorData.availableSousApplications.forEach(sa => {
                    errorMessage += `\n• ${sa.nom} (ID: ${sa.id})`;
                  });
                  errorMessage += `\n\n💡 Conseil : Sélectionnez une sous-application dans votre formulaire.`;
                }
                break;
                
              case 'NO_SOUS_APPLICATION_ALLOWED':
                errorMessage = `⚠️ ${errorData.error}\n\n${errorData.details}\n\n💡 Conseil : Laissez le champ "Sous-application" vide.`;
                break;
                
              case 'INCOMPLETE_FLUX_DATA':
                errorMessage = `⚠️ ${errorData.error}\n\n${errorData.details}`;
                break;
                
              default:
                errorMessage = errorData.details || errorData.error || errorMessage;
            }
          } 
          // Erreurs de validation génériques
          else if (errorData.error) {
            errorMessage = errorData.error;
          }
          // Erreurs de validation Sequelize
          else if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = '❌ Erreurs de validation :\n\n' + errorData.errors.map(err => `• ${err.message}`).join('\n');
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
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
