<template>
  <div>
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
          <tr v-for="(groupList, groupKey) in affectationGroupsAuto" :key="groupKey">
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
  </div>
</template>

<script>
export default {
  name: 'AffectationGroupes',
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    },
    composants: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      affectationGroupsAuto: {},
      dynamicAffectationRows: [],
      suffixAffectationVip: '-SEC-AUTO-VIPs-MEMBRES',
      suffixAffectationSnat: '-SEC-TEC-SNAT-ORCHESTRATION'
    };
  },
  watch: {
    composants: {
      handler() {
        this.updateAutoAffectations();
      },
      deep: true
    },
    modelValue: {
      handler(newVal) {
        this.initDynamicRows(newVal);
      },
      deep: true
    }
  },
  methods: {
    updateAutoAffectations() {
      // Réinitialiser les affectations automatiques
      this.affectationGroupsAuto = {};
      
      // Parcourir tous les composants pour générer les affectations automatiques
      this.composants.forEach(composant => {
        composant.tiers?.forEach(tier => {
          if (tier.optionVIP && tier.optionVIP !== 'Pas de VIP') {
            // Déterminer l'environnement pour les groupes d'affectation
            const env = this.mapGroupAffectionEnv(tier.environnement || '');
            
            if (env) {
              const vipKey = `GR-${env}${this.suffixAffectationVip}`;
              const snatKey = `GR-${env}${this.suffixAffectationSnat}`;
              
              // Initialiser les tableaux si nécessaire
              if (!this.affectationGroupsAuto[vipKey]) {
                this.affectationGroupsAuto[vipKey] = [];
              }
              if (!this.affectationGroupsAuto[snatKey]) {
                this.affectationGroupsAuto[snatKey] = [];
              }
              
              // Ajouter les groupes si ils existent
              if (tier.groups?.groupServeurs && !this.affectationGroupsAuto[vipKey].includes(tier.groups.groupServeurs)) {
                this.affectationGroupsAuto[vipKey].push(tier.groups.groupServeurs);
              }
              if (tier.groups?.groupSNAT && !this.affectationGroupsAuto[snatKey].includes(tier.groups.groupSNAT)) {
                this.affectationGroupsAuto[snatKey].push(tier.groups.groupSNAT);
              }
            }
          }
        });
      });
    },
    
    initDynamicRows(affectationData) {
      // Initialiser les lignes dynamiques avec les données existantes
      this.dynamicAffectationRows = [];
      
      if (affectationData && typeof affectationData === 'object') {
        Object.entries(affectationData).forEach(([key, values]) => {
          if (Array.isArray(values)) {
            this.dynamicAffectationRows.push({
              key,
              values: [...values]
            });
          }
        });
      }
    },
    
    syncAffectation() {
      const updated = {};
      this.dynamicAffectationRows.forEach(entry => {
        const key = entry.key.trim();
        if (key && entry.values.some(v => v.trim() !== '')) {
          updated[key] = [...entry.values];
        }
      });
      this.$emit('update:modelValue', updated);
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
      this.syncAffectation();
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
    }
  },
  
  mounted() {
    this.updateAutoAffectations();
    this.initDynamicRows(this.modelValue);
  }
};
</script> 