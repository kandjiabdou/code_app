<template>
  <v-container fluid>
    <div style="overflow-x: auto">
      <table class="custom-table">
        <thead>
          <tr>
            <th colspan="3" class="text-center bg-green-lighten-4">SOURCE</th>
            <th colspan="3" class="text-center bg-blue-lighten-4">DESTINATION</th>
            <th colspan="2" class="text-center bg-purple-lighten-4">SERVICE</th>
            <th class="text-center bg-orange-lighten-4">ACTION</th>
            <th class="text-center">Actions</th>
          </tr>
          <tr>
            <th class="bg-green-lighten-4">Zone</th>
            <th class="bg-green-lighten-4">Désignation</th>
            <th class="bg-green-lighten-4">@IP / Groupe</th>
            <th class="bg-blue-lighten-4">Zone</th>
            <th class="bg-blue-lighten-4">Désignation</th>
            <th class="bg-blue-lighten-4">CIBLE - @IP / Groupe</th>
            <th class="bg-purple-lighten-4">Protocole</th>
            <th class="bg-purple-lighten-4">Port ou Service</th>
            <th class="text-center bg-orange-lighten-4">Action</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="index">
            <td><v-select class="text-center" v-model="row.sourceZone" :items="zones" variant="outlined" density="compact" /></td>
            <td>
              <auto-expand-input
                v-model="row.sourceDesignation"
                placeholder="Désignation source"
              />
            </td>
            <td>
              <auto-expand-input
                v-model="row.sourceGroup"
                placeholder="Groupe source"
              />
            </td>
            <td><v-select v-model="row.destZone" :items="zones" variant="outlined" density="compact" /></td>
            <td>
              <auto-expand-input
                v-model="row.destDesignation"
                placeholder="Désignation destination"
              />
            </td>
            <td>
              <auto-expand-input
                v-model="row.destGroup"
                placeholder="Groupe destination"
              />
            </td>
            <td><v-select v-model="row.protocol" :items="protocols" variant="outlined" density="compact" /></td>
            <td><v-select v-model="row.port" :items="ports" variant="outlined" density="compact" /></td>
            <td>
              <v-select
                v-model="row.action"
                :items="actions"
                variant="outlined"
                density="compact"
                :class="getActionBackgroundClass(row.action)"
                :color="getActionColor(row.action)"
              />
            </td>
            <td class="text-center">
              <div class="d-flex justify-center align-center ga-2">
                <v-btn icon size="small" @click="duplicateRow(index)" color="primary" title="Dupliquer">
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
                <v-btn icon size="small" @click="removeRow(index)" color="error" title="Supprimer" :disabled="rows.length === 1">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <v-btn color="primary" class="mt-3" @click="addRow">
      <v-icon start>mdi-plus</v-icon>
      Ajouter une ligne
    </v-btn>
  </v-container>
</template>

<script>
import { defineComponent, ref, h } from 'vue'

// Custom auto-expanding input component
const AutoExpandInput = defineComponent({
  props: {
    modelValue: String,
    placeholder: String
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const inputRef = ref(null)
    const value = ref(props.modelValue || '')

    const adjustWidth = () => {
      if (inputRef.value) {
        // Reset width to auto to allow shrinking
        inputRef.value.style.width = 'auto'
       
        // Set width based on content, with a minimum width
        const computedWidth = Math.max(
          inputRef.value.scrollWidth,
          100 // Minimum width of 100px
        )
        inputRef.value.style.width = `${computedWidth}px`
      }
    }

    const onInput = (event) => {
      const newValue = event.target.value
      value.value = newValue
      emit('update:modelValue', newValue)
     
      // Adjust width after input
      adjustWidth()
    }

    return {
      inputRef,
      value,
      onInput,
      adjustWidth
    }
  },
  mounted() {
    // Initial width adjustment
    this.$nextTick(this.adjustWidth)
  },
  render() {
    return h('input', {
      ref: 'inputRef',
      type: 'text',
      class: 'auto-expand-input',
      value: this.value,
      placeholder: this.placeholder,
      onInput: this.onInput
    })
  }
})

export default {
  components: {
    AutoExpandInput
  },
  props: {
    initialData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      zones: [
        'Internet', 'Partenaires', 'Zone Publique', 'Zone Sécurisée Externe',
        'Zone Sécurisée Interne', 'Zone Sécurisée Technique', 'Zone Serveurs Non Critiques',
        'Zone Utilisateurs', 'DMZ Privée', 'LAN Serveurs', 'Zone de Management'
      ],
      protocols: [
        'TCP', 'UDP', 'HTTP', 'HTTPS', 'CFT SFTP', 'CFT PeSIT-E',
        'CFT PeSIT-E SSL', 'JMX', 'SQL'
      ],
      ports: [
        '8080', '80', '3000', '443', 'SERVICE-CIFS-SLF', 'SERVICE-NFS-SLF',
        'SERVICE-DB2-SLF', 'SERVICE-MySQL-SLF', 'SERVICE-ORACLE-SLF',
        'SERVICE-POSTGRES-SLF', 'SERVICE-MONGODB-SLF', 'SERVICE-MSSQL-SLF',
        '6321', '6330', '7330', '6002', 'GR-SERVICES-AD'
      ],
      actions: ['Autoriser', 'Modifier', 'Fermer'],
      rows: []
    };
  },
  watch: {
    initialData: {
      handler(newData) {
        if (newData && newData.length > 0) {
          this.rows = [...newData];
        }
      },
      immediate: true
    }
  },
  methods: {
    getActionColor(action) {
      return {
        Autoriser: 'success',
        Modifier: 'orange',
        Fermer: 'error'
      }[action] || '';
    },
    getActionBackgroundClass(action) {
      return {
        'bg-green-lighten-3': action === 'Autoriser',
        'bg-orange-lighten-3': action === 'Modifier',
        'bg-red-lighten-3': action === 'Fermer'
      };
    },
    addRow() {
      this.rows.push(this.createEmptyRow());
    },
    removeRow(index) {
      this.rows.splice(index, 1);
    },
    duplicateRow(index) {
      const duplicate = JSON.parse(JSON.stringify(this.rows[index]));
      this.rows.splice(index + 1, 0, duplicate);
    },
    createEmptyRow() {
      return {
        sourceZone: '',
        sourceDesignation: '',
        sourceGroup: '',
        destZone: '',
        destDesignation: '',
        destGroup: '',
        protocol: '',
        port: '',
        action: ''
      };
    },
    getMaticeFlux() {
      return this.rows;
    }
  },
  mounted() {
    // Ajouter une ligne par défaut seulement si pas de données initiales
    if (!this.initialData || this.initialData.length === 0) {
      this.addRow();
    }
  }
};
</script>

<style scoped>
.custom-table {
  width: max-content;
  border-collapse: collapse;
}

.custom-table th,
.custom-table td {
  padding: 4px;
  vertical-align: middle;
  white-space: nowrap;
}

/* Remove default margins and paddings from Vuetify components */
.v-select,
.v-field {
  flex: 1;
  min-height: 40px !important;
  height: 40px !important;
  text-align: center;
}

.v-field {
  padding: 0 8px !important;
}

.v-field__input {
  padding: 0 !important;
  min-height: 40px !important;
  height: 40px !important;
}

.v-select .v-field--variant-outlined {
  box-shadow: none !important;
}

.auto-expand-input {
  min-width: 100px;
  max-width: none;
  border: 1px solid #ccc;
  padding: 6px 8px;
  box-sizing: border-box;
  font-size: 14px;
  outline: none;
  transition: width 0.1s ease;
  height: 40px;
  line-height: 26px;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.bg-green-lighten-3,
.bg-orange-lighten-3,
.bg-red-lighten-3 {
  transition: background-color 0.3s ease;
}

.bg-green-lighten-3 .v-field {
  background-color: rgb(var(--v-theme-green-lighten-3)) !important;
}

.bg-orange-lighten-3 .v-field {
  background-color: rgb(var(--v-theme-orange-lighten-3)) !important;
}

.bg-red-lighten-3 .v-field {
  background-color: rgb(var(--v-theme-red-lighten-3)) !important;
}
</style>
