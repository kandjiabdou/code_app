<template>
  <v-container fluid>
    <v-form ref="form">
      <!-- Infos générales -->
      <v-card class="pa-2 mb-3" outlined>
        <v-card-title class="text-h6">Informations générales</v-card-title>
        <v-row dense>
          <v-col cols="8">
            <v-text-field v-model="demandeDataForm.nomDemandeOuverture" label="Nom de la demande" persistent-hint disabled dense hide-details="auto" density="compact" bg-color="orange" variant="outlined" rounded/>
          </v-col>
          <v-col cols="4">
            <v-text-field v-model="demandeDataForm.proprietaire" label="Proprietaire" persistent-hint disabled dense hide-details="auto" density="compact" bg-color="orange" variant="outlined" rounded/>
          </v-col>
        </v-row>
      </v-card>
      <!-- Infos générales -->
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
              :rules="requiredRules"
              dense
              hide-details="auto"
              rounded
              variant="outlined"
              clearable
              @update:model-value="onApplicationSelected"
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
              v-model="demandeDataForm.nomRessourceCloud" 
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
            />
          </v-col>
          <v-col cols="12" :md="selectedApplicationData.hasSousApp ? 6 : 12">
            <v-select
              v-model="demandeDataForm.environnement"
              :items="availableEnvironnements"
              label="Environnement à créer *"
              :rules="requiredRules"
              dense
              hide-details="auto"
              rounded
              variant="outlined"
              :disabled="!availableEnvironnements.length"
              :hint="!availableEnvironnements.length ? 'Tous les environnements existent déjà' : `${availableEnvironnements.length} environnement(s) disponible(s)`"
              persistent-hint
            />
          </v-col>
        </v-row>
      </v-card>

      <!-- composants dynamiques -->
      <div v-if="demandeDataForm.composants.length">
        <v-card v-for="(composant, index) in demandeDataForm.composants" :key="`composant-${index}`" color="grey-lighten-3 lighten-10" class="pa-2 mb-3" outlined>
          <v-card-title class="text-h6 d-flex align-center pa-0">
            <span>Composant {{ index + 1 }}</span>
            <v-spacer/>
            <v-btn size="small" icon color="error" @click="removeComposant(index)" title="Supprimer">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-card-title>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-select density="compact" v-model="composant.type" :items="composantTypes" label="Composant Tiers" :rules="requiredRules" dense hide-details="auto" rounded outlined/>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="composant.nomComposant" density="compact" label="Nom composant (Optionnel)" persistent-hint :rules="optionalMajusculeRules" dense hide-details="auto" rounded variant="outlined"/>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="composant.nomNetworkGroupVRA" label="Nom Network Group VRA" persistent-hint disabled dense hide-details="auto" density="compact" bg-color="orange" variant="outlined" rounded/>
            </v-col>
          </v-row>

          <!-- Tiers dynamiques -->
          <div v-if="composant.tiers.length">
            <v-card v-for="(tier, tierIndex) in composant.tiers" :key="`tier-${index}-${tierIndex}`" class="pa-2 mb-2 mt-2" color="grey lighten-4" outlined>
              <div class="d-flex align-center mb-1">
                <span class="subtitle-2 font-weight-medium">Tier {{ tierIndex + 1 }}</span>
                <v-spacer/>
                <v-btn size="x-small" icon color="error" @click="removeTier(index, tierIndex)" title="Supprimer le tier">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
             
              <v-row dense>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="tier.type"
                    :items="typeTiers"
                    label="Type de tier *"
                    :rules="requiredRules"
                    density="compact"
                    dense
                    hide-details="auto"
                    outlined
                  />
                </v-col>

               

                <v-col cols="12" md="3">
                  <v-select
                    v-model="tier.zoneSecurite"
                    :items="zonesSecurite"
                    label="Zone de Sécurité *"
                    :rules="requiredRules"
                    density="compact"
                    dense
                    hide-details="auto"
                    outlined
                  />
                </v-col>

                <v-col cols="12" md="1"></v-col>

                <v-col cols="12" md="5" class="d-flex align-center">
                  <span class="mr-3 font-weight-medium">Option VIP <span class="red--text">*</span></span>
                  <v-radio-group
                    v-model="tier.optionVIP"
                    row
                    :rules="requiredRules"
                    hide-details="auto"
                    density="compact"
                    inline
                  >
                    <v-radio label="Pas de VIP" value="Pas de VIP" />
                    <v-radio label="VIP F5" value="VIP F5" />
                  </v-radio-group>
                </v-col>
              </v-row>

              <!-- Groupes réseau -->
              <v-row dense>
                <template v-if="tier.groups.groupServeurs">
                  <v-col cols="12" md="3" class="text-left font-weight-medium">Groupe Serveurs :</v-col>
                  <v-col cols="12" md="9">
                    <v-chip density="compact" color="primary" variant="outlined">{{ tier.groups.groupServeurs }}</v-chip>
                  </v-col>
                </template>
                <template v-if="tier.groups.groupVIP">
                  <v-col cols="12" md="3" class="text-left font-weight-medium">Groupe VIP PRIV :</v-col>
                  <v-col cols="12" md="9">
                    <v-chip density="compact" color="primary" variant="outlined">{{ tier.groups.groupVIP }}</v-chip>
                  </v-col>
                </template>
                <template v-if="tier.groups.groupSNAT">
                  <v-col cols="12" md="3" class="text-left font-weight-medium">Groupe SNAT PRIV :</v-col>
                  <v-col cols="12" md="9">
                    <v-chip density="compact" color="primary" variant="outlined">{{ tier.groups.groupSNAT }}</v-chip>
                  </v-col>
                </template>
              </v-row>
            </v-card>
          </div>

          <!-- Bouton ajouter tier -->
          <v-btn color="secondary" text class="mt-1 mb-1" @click="addTier(index)">
            <v-icon left>mdi-plus</v-icon>
            Ajouter un tier
          </v-btn>
        </v-card>
      </div>

      <!-- Ajouter un composant -->
      <v-btn color="primary" text class="mt-1" @click="addComposant">
        <v-icon left>mdi-plus</v-icon>
        Ajouter un Composant
      </v-btn>
     
      <!-- Tableau affection de groups-->
      <v-card class="pa-2 mb-3 mt-3" outlined>
        <v-card-title class="text-h6">Affection de groupes AUTO</v-card-title>
        <v-table dense>
          <thead>
            <tr>
              <th scope="comso">Groupe consomation</th>
              <th scope="service">À Affecter au Groupe de "Service"</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(groupList, groupKey) in demandeDataForm.affectationGroups" :key="groupKey">
              <td>
                <v-chip
                  v-for="group in groupList"
                  :key="group"
                  class="ma-1"
                  color="primary"
                  density="compact"
                  variant="outlined"
                >
                  {{ group }}
                </v-chip>
              </td>
              <td>
                <v-chip class="ma-1" color="secondary" density="compact" variant="outlined">
                  {{ groupKey }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
     

      <!-- Tableau d'affectation de groupes personnalisés -->
       <v-card class="pa-2 mb-3" outlined>
        <v-card-title class="text-h6">Affection de groupes (Saisie manuelle)</v-card-title>
        <v-table density="compact" class="elevation-1">
          <thead>
            <tr>
              <th>Groupe consommation</th>
              <th>À Affecter au Groupe de "Service"</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in dynamicAffectationRows" :key="entry.key">
              <td>
                <div class="d-flex flex-column">
                  <div
                    v-for="(value, i) in entry.values"
                    :key="i"
                    class="d-flex align-center mb-1"
                  >
                    <v-text-field
                      v-model="entry.values[i]"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="flex-grow-1"
                      @input="syncAffectation"
                    />
                    <v-btn
                      icon
                      size="small"
                      color="error"
                      variant="text"
                      class="ml-1"
                      @click="removeGroupInput(index, i)"
                      v-if="entry.values.length > 1"
                    >
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>
                  </div>
                  <v-btn
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click="addGroupInput(index)"
                  >
                    <v-icon start>mdi-plus</v-icon>
                    Ajouter un groupe
                  </v-btn>
                </div>
              </td>

              <td>
                <v-text-field
                  v-model="entry.key"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="flex-grow-1"
                  @input="updateGroupKey(index)"
                />
              </td>

              <td>
                <v-btn
                  icon
                  color="error"
                  variant="text"
                  @click="removeLine(index)"
                  title="Supprimer la ligne"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-btn color="primary" class="mt-2" @click="addLine">
          <v-icon start>mdi-plus</v-icon>
          Ajouter une ligne
        </v-btn>
      </v-card>
      <div>
       
      </div>


      <v-divider class="my-4"/>
    </v-form>
  </v-container>
</template>

<script>
import { apiService } from '@/services/api.service';

export default {
  name: 'FormulaireCMDB',
  data() {
    return {
      formValid: false,
      demandeDataForm: {
        nomDemandeOuverture:'',
        proprietaire : 'Moi',
        nomApplication: '',
        nomRessourceCloud: '',
        nomSousApplication:'',
        environnement: '',
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
        affectationGroupsInputs: {},
      },
      environnements: ['POC', 'DEV', 'REC', 'PPR', 'PRD'],
      composantTypes: ['1-Tier', '2-Tier', '3-Tier'],
      typeTiers: ['Application', 'Présentation', 'Base de données', 'NAS'],
      zonesSecurite: ['STD', 'SEC-INT', 'SEC-EXT', 'TEC-INT', 'TEC-EXT', 'MGMT'],
      suffixAffectationVip: '-SEC-AUTO-VIPs-MEMBRES',
      suffixAffectationSnat: '-SEC-TEC-SNAT-ORCHESTRATION',
      groupAffectionBDD: 'GR-SRV-REBONDS-DBA',
      dynamicAffectationRows: [],
      requiredRules: [v => !!v || 'Ce champ est obligatoire'],
      optionalMajusculeRules: [
        v => !v || (v.length <= 12 && /^[A-Z]*$/.test(v)) || 'Maximum 12 caractères majuscules sans espace'
      ],
      selectedApplication: null,
      selectedApplicationData: null,
      searchTerm: '',
      searchLoading: false,
      applicationsSearch: [],
      selectedSousApplication: null,
      availableEnvironnements: [],
      searchTimeout: null
    };
  },
  watch: {
    'demandeDataForm.nomApplication'(val) {
      this.demandeDataForm.nomApplication = val ? val.trim().toUpperCase() : '';
      this.updatetNomDemande();
    },
    'demandeDataForm.nomRessourceCloud'(val) {
      this.demandeDataForm.nomRessourceCloud = this.formatMajusculesSansEspaces(val);
      this.updatetNomDemande();
      this.updateAllNomNetworkGroupVRA();
      this.generateGroupNames();
    },
    'demandeDataForm.nomSousApplication'(val) {
      this.demandeDataForm.nomSousApplication = this.formatMajusculesSansEspaces(val);
      this.updatetNomDemande();
      this.updateAllNomNetworkGroupVRA();
      this.generateGroupNames();
    },
    'demandeDataForm.environnement'(){
      this.updatetNomDemande();
      this.generateGroupNames();
    },
    'demandeDataForm.composants': {
      deep: true,
      handler() {
        this.formatComposantNames();
        this.updateAllNomNetworkGroupVRA();
        this.generateGroupNames();
      }
    },
    'demandeDataForm.affectationGroupsInputs': {
      handler(newVal) {
        this.serviceKeys = Object.keys(newVal);
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    updatetNomDemande() {
      const parts = ["Ouverture_Firewall", this.formatMajusculesSansEspaces(this.demandeDataForm.nomApplication), this.demandeDataForm.nomRessourceCloud, this.demandeDataForm.nomSousApplication, this.demandeDataForm.environnement].filter(Boolean);
      this.demandeDataForm.nomDemandeOuverture = parts.join('-');
    },
    formatMajusculesSansEspaces(value) {
      return value ? value.replace(/\s+/g, '').toUpperCase() : '';
    },
    formatComposantNames() {
      this.demandeDataForm.composants.forEach(bp => {
        bp.nomComposant = this.formatMajusculesSansEspaces(bp.nomComposant);
      });
    },
    updateAllNomNetworkGroupVRA() {
      const nomCloud = this.demandeDataForm.nomRessourceCloud;
      const nomSousApplication = this.demandeDataForm.nomSousApplication;
      this.demandeDataForm.composants.forEach(bp => {
        const parts = [nomCloud, nomSousApplication, bp.nomComposant].filter(Boolean);
        bp.nomNetworkGroupVRA = parts.join('-');
      });
    },
    addComposant() {
      this.demandeDataForm.composants.push({
        type: '',
        nomComposant: '',
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
      });
    },
    removeComposant(index) {
      this.demandeDataForm.composants.splice(index, 1);
    },
    addTier(index) {
      this.demandeDataForm.composants[index].tiers.push({
        type: '',
        zoneSecurite: '',
        optionVIP: 'Pas de VIP',
        groups: {
          groupServeurs: '',
          groupVIP: '',
          groupSNAT: ''
        }
      });
    },
    removeTier(bpIndex, tierIndex) {
      this.demandeDataForm.composants[bpIndex].tiers.splice(tierIndex, 1);
    },
    resetForm() {
      this.$refs.form.reset();
      this.demandeDataForm = {
        nomApplication: '',
        nomRessourceCloud: '',
        environnement: '',
        composants: [],
        affectationGroups: {}
      };
    },
    async validateForm() {
      const isValid = await this.$refs.form.validate();
      this.formValid = isValid;
      return isValid;
    },
    getDemandeDataForm() {
      return this.demandeDataForm;
    },
    generateGroupNames() {
      const envCode = this.mapEnvironment(this.demandeDataForm.environnement);
      const cloud= this.demandeDataForm.nomRessourceCloud;
      const nomSousApplication = this.demandeDataForm.nomSousApplication;
      this.initGroupAffectations(envCode);

      this.demandeDataForm.composants.forEach(({ type, nomComposant, tiers }) => {
        tiers.forEach(tier => {
          const { zoneSecurite: zone, type: tierType, optionVIP } = tier;
          const suffix = this.getTierSuffix(type, tierType);
          const groupBase = {
            env: envCode,
            zone,
            cloud,
            sousApp: nomSousApplication,
            composant: nomComposant,
            suffix,
            vipSnat: ''
          };

          // Serveurs
          tier.groups.groupServeurs = this.buildGroupName(groupBase);

          // VIP & SNAT
          if (optionVIP && optionVIP !== 'Pas de VIP') {
            const vipZone = 'SEC-TEC';
            const baseVIP = { ...groupBase, zone: vipZone };

            tier.groups.groupVIP = this.buildGroupName({ ...baseVIP, vipSnat: 'VIP' });
            tier.groups.groupSNAT = this.buildGroupName({ ...baseVIP, vipSnat: 'SNAT' });

            this.demandeDataForm.affectationGroups[this.getGroupAffectationVIP(envCode)].push(tier.groups.groupServeurs);
            this.demandeDataForm.affectationGroups[this.getGroupAffectationSNAT(envCode)].push(tier.groups.groupSNAT);
          } else {
            tier.groups.groupVIP = '';
            tier.groups.groupSNAT = '';
          }
        });
      });
    },
    buildGroupName({ env, zone, cloud, sousApp, composant, suffix, vipSnat }) {
      return ['GR', env, zone, 'AUTO', cloud, sousApp, composant, suffix, vipSnat]
        .filter(Boolean)
        .join('-');
    },
    getTierSuffix(composantType, tierType) {
      if (composantType === '3-Tier' && tierType === 'Présentation') return 'FRONT';
      if (tierType === 'Base de données') return 'BDD';
      if (tierType === 'NAS') return 'NAS';
      return '';
    },
    mapEnvironment(env) {
      return {
        PRD: 'PRD',
        PPR: 'PRD',
        REC: 'HPR',
        INT: 'HPR',
        POC: 'POC',
        DEV: 'DEV'
      }[env] || '';
    },
    mapGroupAffectionEnv(env) {
      return {
        PRD: 'PRD',
        PPR: 'PRD',
        REC: 'HPR',
        INT: 'HPR',
        POC: 'HPR',
        DEV: 'HPR'
      }[env] || '';
    },
    getGroupAffectationVIP(env) {
      return `GR-${env}${this.suffixAffectationVip}`;
    },
    getGroupAffectationSNAT(env) {
      return `GR-${env}${this.suffixAffectationSnat}`;
    },
    initGroupAffectations(env) {
      this.demandeDataForm.affectationGroups = {
        [this.getGroupAffectationVIP(env)]: [],
        [this.getGroupAffectationSNAT(env)]: [],
      };
    },
    syncAffectation() {
      const updated = {};
      this.dynamicAffectationRows.forEach(entry => {
        const key = entry.key.trim();
        if (key && entry.values.some(v => v.trim() !== '')) {
          updated[key] = [...entry.values];
        }
      });
      this.demandeDataForm.affectationGroupsInputs = updated;
    },
    addLine() {
      this.dynamicAffectationRows.push({
        key: `Service ${this.dynamicAffectationRows.length + 1}`,
        values: ['']
      });
      this.syncAffectation();
    },
    removeLine(index) {
      this.dynamicAffectationRows.splice(index, 1);
      this.syncAffectation();
    },
    addGroupInput(rowIndex) {
      this.dynamicAffectationRows[rowIndex].values.push('');
      this.syncAffectation();
    },
    removeGroupInput(rowIndex, valIndex) {
      const row = this.dynamicAffectationRows[rowIndex];
      row.values.splice(valIndex, 1);
      if (row.values.length === 0) {
        this.removeLine(rowIndex);
      } else {
        this.syncAffectation();
      }
    },
    updateGroupKey() {
      // Automatically sync with demandeDataForm on key change
      this.syncAffectation();
    },
    onSearchUpdate(search) {
      this.searchTerm = search;
      
      // Debounce la recherche
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
      this.selectedApplication = applicationId;
      this.selectedSousApplication = null;
      this.demandeDataForm.environnement = '';
      this.availableEnvironnements = [];
      
      if (applicationId) {
        // Trouver l'application sélectionnée dans les résultats
        this.selectedApplicationData = this.applicationsSearch.find(app => app.id === applicationId);
        
        if (this.selectedApplicationData) {
          // Remplir automatiquement les champs
          this.demandeDataForm.nomApplication = this.selectedApplicationData.nomApplication;
          this.demandeDataForm.nomRessourceCloud = this.selectedApplicationData.nomRessourceCloud;
          this.demandeDataForm.nomSousApplication = '';
          
          // Mettre à jour les environnements disponibles
          this.updateAvailableEnvironnements();
        }
      } else {
        this.selectedApplicationData = null;
        this.demandeDataForm.nomApplication = '';
        this.demandeDataForm.nomRessourceCloud = '';
        this.demandeDataForm.nomSousApplication = '';
      }
    },
    onSousApplicationSelected(sousAppId) {
      this.selectedSousApplication = sousAppId;
      this.demandeDataForm.environnement = '';
      
      if (sousAppId && this.selectedApplicationData) {
        const sousApp = this.selectedApplicationData.sousApplications.find(sa => sa.id === sousAppId);
        if (sousApp) {
          this.demandeDataForm.nomSousApplication = sousApp.nomSousApplication;
          this.availableEnvironnements = sousApp.environnementsDisponibles;
        }
      } else {
        this.demandeDataForm.nomSousApplication = '';
        this.updateAvailableEnvironnements();
      }
    },
    updateAvailableEnvironnements() {
      if (!this.selectedApplicationData) {
        this.availableEnvironnements = [];
        return;
      }
      
      if (this.selectedApplicationData.hasSousApp) {
        // Si l'application a des sous-applications, on attend la sélection d'une sous-app
        if (this.selectedSousApplication) {
          const sousApp = this.selectedApplicationData.sousApplications.find(sa => sa.id === this.selectedSousApplication);
          this.availableEnvironnements = sousApp ? sousApp.environnementsDisponibles : [];
        } else {
          this.availableEnvironnements = [];
        }
      } else {
        // Application sans sous-applications
        this.availableEnvironnements = this.selectedApplicationData.environnementsDisponibles || [];
      }
    }
  },
  beforeUnmount() {
    // Nettoyer les timeouts
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
};
</script>
