<template>
    <v-container style="max-width: 90%; width: 90%">
      <v-sheet :elevation="12">
        <v-card>
          <!-- En-tête -->
          <v-sheet
            :elevation="6"
            justify="center"
            class="d-flex align-center justify-center"
          >
            <v-container fluid>
              <v-row justify="center" align="center">
                <v-col cols="12" sm="2">
                  <v-img
                    src="vra_dep.png"
                    contain
                    justify="center"
                    height="50"
                    width="50"
                  ></v-img>
                </v-col>
                <v-col cols="12" sm="10">
                  <v-card-title class="justify-center">
                    Ouverture de flux
                  </v-card-title>
                </v-col>
              </v-row>
            </v-container>
          </v-sheet>
  
          <div justify="center" class="pa-1">
            <div md="6">
              <!-- Bouton pour afficher le formulaire -->
              <v-col class="text-center" cols="auto" v-if="!showForm">
                <v-btn color="success" @click="showForm = true">
                  + Nouvelle demande
                </v-btn>
              </v-col>
  
              <!-- Formulaire OpenFluxTab -->
              <v-card class="pb-5 ma-5" v-if="showForm">
                <OpenFluxTab @cancel="handleCancel" />
              </v-card>
  
              <!-- Onglet -->
              <v-card class="ma-5">
                <OpenFluxListApp />
              </v-card>
            </div>
          </div>
        </v-card>
      </v-sheet>
    </v-container>
  </template>
  
  <script>
  import OpenFluxTab from "../components/OpenFluxTab";
  import OpenFluxListApp from "../components/OpenFluxListApp";
  
  export default {
    components: { OpenFluxListApp, OpenFluxTab },
    data() {
      return {
        showForm: false,
      };
    },
    methods: {
      handleCancel() {
        this.showForm = false;
      },
    },
  };
  </script>
  