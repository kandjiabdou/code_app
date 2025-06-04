<template>
  <v-container fluid>
    <v-form ref="form">
      <!-- Informations générales -->
      <InformationsGenerales 
        v-model="infosGenerales"
        :disabled="false"
      />

      <!-- Application -->
      <SelectionApplication
        v-model="applicationData"
        :read-only="false"
        @application-selected="onApplicationSelected"
        ref="selectionApplicationRef"
      />

      <!-- Composants -->
      <ComposantsSection
        v-model="demandeDataForm.composants"
        :application-data="applicationData"
      />

      <!-- Affectation de groupes -->
      <AffectationGroupes
        v-model="demandeDataForm.affectationGroupsInputs"
        :composants="demandeDataForm.composants"
      />

      <v-divider class="my-4"/>
    </v-form>
  </v-container>
</template>

<script>
import InformationsGenerales from './forms/InformationsGenerales.vue';
import SelectionApplication from './forms/SelectionApplication.vue';
import ComposantsSection from './forms/ComposantsSection.vue';
import AffectationGroupes from './forms/AffectationGroupes.vue';

export default {
  name: 'FormulaireCMDB',
  components: {
    InformationsGenerales,
    SelectionApplication,
    ComposantsSection,
    AffectationGroupes
  },
  data() {
    return {
      formValid: false,
      infosGenerales: {
        nomDemandeOuverture: '',
        proprietaire: 'Moi'
      },
      applicationData: {
        nomApplication: '',
        nomRessourceCloud: '',
        nomSousApplication: '',
        environnement: ''
      },
      demandeDataForm: {
        composants: [
          {
            type: '',
            nomComposant: '',
            nomNetworkGroupVRA: '',
            tiers: [
              {
                type: '',
                zoneSecurite: '',
                optionVIP: 'Pas de VIP',
                groups: {
                  groupServeurs: '',
                  groupVIP: '',
                  groupSNAT: ''
                }
              }
            ]
          }
        ],
        affectationGroups: {},
        affectationGroupsInputs: {}
      },
      selectedApplicationData: null,
      selectedSousApplication: null
    };
  },
  watch: {
    infosGenerales: {
      handler() {
        this.updateNomDemande();
      },
      deep: true
    },
    applicationData: {
      handler() {
        this.updateNomDemande();
      },
      deep: true
    }
  },
  methods: {
    updateNomDemande() {
      const parts = [
        "Ouverture_Firewall", 
        this.formatMajusculesSansEspaces(this.applicationData.nomApplication), 
        this.applicationData.nomRessourceCloud, 
        this.applicationData.nomSousApplication, 
        this.applicationData.environnement
      ].filter(Boolean);
      
      this.infosGenerales.nomDemandeOuverture = parts.join('-');
    },
    
    formatMajusculesSansEspaces(value) {
      return value ? value.replace(/\s+/g, '').toUpperCase() : '';
    },
    
    onApplicationSelected(appData) {
      this.selectedApplicationData = appData;
    },
    
    async validateForm() {
      const isValid = await this.$refs.form.validate();
      this.formValid = isValid;
      return isValid;
    },
    
    getDemandeDataForm() {
      // Combiner toutes les données pour la soumission
      return {
        ...this.infosGenerales,
        ...this.applicationData,
        ...this.demandeDataForm
      };
    },
    
    // Méthodes pour maintenir la compatibilité avec OpenFluxTab.vue
    getSelectedApplicationData() {
      return this.$refs.selectionApplicationRef?.getSelectedApplicationData();
    },
    
    getSelectedSousApplication() {
      return this.$refs.selectionApplicationRef?.getSelectedSousApplication();
    }
  }
};
</script>
