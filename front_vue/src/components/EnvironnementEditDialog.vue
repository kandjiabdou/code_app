<template>
  <v-dialog v-model="dialog" max-width="1200px" persistent>
    <v-card>
      <v-card-title class="text-h5 pa-4 bg-primary">
        <v-icon start>mdi-pencil</v-icon>
        Édition de l'environnement
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog" variant="text" color="white">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-container fluid>
          <v-form ref="form">
            <!-- Informations générales (non éditables) -->
            <InformationsGenerales
              v-model="formData.infosGenerales"
              :disabled="true"
            />

            <!-- Application (non éditable) -->
            <SelectionApplication
              v-model="formData.application"
              :read-only="true"
              :prefilled-application="prefilledApplicationData"
            />

            <!-- Composants (éditables) -->
            <ComposantsSection
              v-model="formData.composants"
              :application-data="formData.application"
            />

            <!-- Matrice de flux (éditable) -->
            <v-card class="pa-2 mb-3" outlined>
              <v-card-title class="text-h6">Matrice de Flux</v-card-title>
              <OpenFluxMatrice ref="matriceFluxRef" :initial-data="formData.matriceFlux" />
            </v-card>

            <!-- Affectation de groupes (éditable) -->
            <AffectationGroupes
              v-model="formData.affectationGroups"
              :composants="formData.composants"
            />
          </v-form>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          variant="outlined"
          @click="closeDialog"
        >
          Annuler
        </v-btn>
        <v-btn
          color="primary"
          @click="saveChanges"
          :loading="saving"
        >
          Sauvegarder les modifications
        </v-btn>
      </v-card-actions>

      <v-snackbar 
        v-model="snackbar.show" 
        :color="snackbar.color" 
        :timeout="snackbar.timeout"
        location="top"
      >
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn variant="text" @click="snackbar.show = false">Fermer</v-btn>
        </template>
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script>
import InformationsGenerales from './forms/InformationsGenerales.vue';
import SelectionApplication from './forms/SelectionApplication.vue';
import ComposantsSection from './forms/ComposantsSection.vue';
import AffectationGroupes from './forms/AffectationGroupes.vue';
import OpenFluxMatrice from './OpenFluxMatrice.vue';
import { apiService } from '@/services/api.service';

export default {
  name: 'EnvironnementEditDialog',
  components: {
    InformationsGenerales,
    SelectionApplication,
    ComposantsSection,
    AffectationGroupes,
    OpenFluxMatrice
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    environnementData: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'environment-updated'],
  data() {
    return {
      dialog: false,
      saving: false,
      formData: {
        infosGenerales: {
          nomDemandeOuverture: '',
          proprietaire: ''
        },
        application: {
          nomApplication: '',
          nomRessourceCloud: '',
          nomSousApplication: '',
          environnement: ''
        },
        composants: [],
        matriceFlux: [],
        affectationGroups: {}
      },
      prefilledApplicationData: null,
      snackbar: {
        show: false,
        text: '',
        color: 'success',
        timeout: 6000
      }
    };
  },
  watch: {
    modelValue(val) {
      this.dialog = val;
      if (val && this.environnementData) {
        this.loadEnvironnementData();
      }
    },
    dialog(val) {
      this.$emit('update:modelValue', val);
      if (!val) {
        this.resetForm();
      }
    }
  },
  methods: {
    async loadEnvironnementData() {
      try {
        const env = this.environnementData;
        
        // Informations générales (depuis la demande associée)
        this.formData.infosGenerales = {
          nomDemandeOuverture: env.idOuvertureEnv || '',
          proprietaire: env.Demandes?.[0]?.proprietaire || 'N/A'
        };

        // Application
        this.formData.application = {
          nomApplication: env.Application?.nomApplication || '',
          nomRessourceCloud: env.Application?.nomRessourceCloud || '',
          nomSousApplication: env.SousApplication?.nomSousApplication || '',
          environnement: env.typeEnvironnement || ''
        };

        // Préparer les données d'application pour le composant SelectionApplication
        this.prefilledApplicationData = {
          id: env.Application?.id,
          nomApplication: env.Application?.nomApplication,
          nomRessourceCloud: env.Application?.nomRessourceCloud,
          hasSousApp: !!env.SousApplication,
          selectedSousApplication: env.SousApplication ? {
            id: env.SousApplication.id,
            nomSousApplication: env.SousApplication.nomSousApplication
          } : null
        };

        // Composants
        this.formData.composants = env.Composants?.map(comp => ({
          type: comp.typeComposantTiers || '',
          nomComposant: comp.nomComposant || '',
          nomNetworkGroupVRA: comp.nomNetworkGroupVra || '',
          tiers: comp.Tiers?.map(tier => ({
            type: tier.typeTier || '',
            zoneSecurite: tier.zoneSecurite || '',
            optionVIP: tier.optionVip || 'Pas de VIP',
            groups: {
              groupServeurs: tier.Groupes?.[0]?.groupeServeur || '',
              groupVIP: tier.Groupes?.[0]?.groupeVip || '',
              groupSNAT: tier.Groupes?.[0]?.groupeSnat || ''
            }
          })) || []
        })) || [];

        // Matrice de flux
        this.formData.matriceFlux = env.MatriceFluxes?.map(flux => ({
          sourceZone: flux.sourceZone || '',
          sourceDesignation: flux.sourceDesignation || '',
          sourceGroup: flux.sourceGroupe || '',
          destZone: flux.destZone || '',
          destDesignation: flux.destDesignation || '',
          destGroup: flux.destGroupe || '',
          protocol: flux.protocole || '',
          port: flux.port || '',
          action: flux.action || ''
        })) || [];

        // Passer les données initiales à la matrice de flux
        this.$nextTick(() => {
          if (this.$refs.matriceFluxRef && this.formData.matriceFlux.length > 0) {
            this.$refs.matriceFluxRef.rows = [...this.formData.matriceFlux];
          }
        });

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        this.showSnackbar('Erreur lors du chargement des données', 'error');
      }
    },

    async saveChanges() {
      try {
        this.saving = true;

        // Validation
        const isValid = await this.$refs.form.validate();
        if (!isValid.valid) {
          this.showSnackbar('Formulaire invalide, corrigez les erreurs !', 'error');
          return;
        }

        // Récupérer les données de la matrice de flux
        const matriceFlux = this.$refs.matriceFluxRef.getMaticeFlux();

        // Préparer les données pour l'API
        const updateData = {
          typeEnvironnement: this.formData.application.environnement,
          idOuvertureEnv: this.formData.infosGenerales.nomDemandeOuverture,
          utilisateurCreateur: 'user-edit', // Ou récupérer l'utilisateur connecté
          composants: this.formData.composants,
          matriceFlux: matriceFlux
        };

        // Appeler l'API de mise à jour
        const updatedEnvironnement = await apiService.updateEnvironnement(
          this.environnementData.id,
          updateData
        );

        this.showSnackbar('Environnement mis à jour avec succès !', 'success');
        this.$emit('environment-updated', updatedEnvironnement);
        
        setTimeout(() => {
          this.closeDialog();
        }, 1500);

      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        this.showSnackbar(
          error.response?.data?.error || 'Erreur lors de la sauvegarde',
          'error'
        );
      } finally {
        this.saving = false;
      }
    },

    closeDialog() {
      this.dialog = false;
    },

    resetForm() {
      this.formData = {
        infosGenerales: {
          nomDemandeOuverture: '',
          proprietaire: ''
        },
        application: {
          nomApplication: '',
          nomRessourceCloud: '',
          nomSousApplication: '',
          environnement: ''
        },
        composants: [],
        matriceFlux: [],
        affectationGroups: {}
      };
      this.prefilledApplicationData = null;
    },

    showSnackbar(text, color = 'success') {
      this.snackbar = {
        show: true,
        text,
        color,
        timeout: color === 'error' ? 8000 : 6000
      };
    }
  }
};
</script>

<style scoped>
.v-dialog .v-card {
  overflow-y: auto;
  max-height: 90vh;
}
</style> 