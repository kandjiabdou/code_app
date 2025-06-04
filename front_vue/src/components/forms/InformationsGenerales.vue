<template>
  <v-card class="pa-2 mb-3" outlined>
    <v-card-title class="text-h6">Informations générales</v-card-title>
    <v-row dense>
      <v-col cols="8">
        <v-text-field 
          v-model="localData.nomDemandeOuverture" 
          label="Nom de la demande" 
          persistent-hint 
          :disabled="disabled" 
          dense 
          hide-details="auto" 
          density="compact" 
          :bg-color="disabled ? 'orange' : 'white'"
          variant="outlined" 
          rounded
          @input="updateData"
        />
      </v-col>
      <v-col cols="4">
        <v-text-field 
          v-model="localData.proprietaire" 
          label="Proprietaire" 
          persistent-hint 
          :disabled="disabled" 
          dense 
          hide-details="auto" 
          density="compact" 
          :bg-color="disabled ? 'orange' : 'white'"
          variant="outlined" 
          rounded
          @input="updateData"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
export default {
  name: 'InformationsGenerales',
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        nomDemandeOuverture: '',
        proprietaire: 'Moi'
      })
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      localData: { ...this.modelValue }
    };
  },
  watch: {
    modelValue: {
      handler(newVal) {
        this.localData = { ...newVal };
      },
      deep: true
    }
  },
  methods: {
    updateData() {
      this.$emit('update:modelValue', { ...this.localData });
    }
  }
};
</script> 