'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Nettoyer les données existantes (dans l'ordre des dépendances)
      await queryInterface.bulkDelete('matrice_flux', null, { transaction });
      await queryInterface.bulkDelete('groupes', null, { transaction });
      await queryInterface.bulkDelete('tiers', null, { transaction });
      await queryInterface.bulkDelete('composants', null, { transaction });
      await queryInterface.bulkDelete('modifications', null, { transaction });
      await queryInterface.bulkDelete('demandes', null, { transaction });
      await queryInterface.bulkDelete('version_environnements', null, { transaction });
      await queryInterface.bulkDelete('environnements', null, { transaction });
      await queryInterface.bulkDelete('sous_applications', null, { transaction });
      await queryInterface.bulkDelete('applications', null, { transaction });

      // 1. Insérer les Applications
      await queryInterface.bulkInsert('applications', [
        {
          id: 1,
          nomApplication: 'App Alpha',
          nomRessourceCloud: 'ALPHA-CLOUD',
          hasSousApp: true
        },
        {
          id: 2,
          nomApplication: 'App Beta',
          nomRessourceCloud: 'BETA-CLOUD',
          hasSousApp: false
        },
        {
          id: 3,
          nomApplication: 'App Gamma',
          nomRessourceCloud: 'GAMMA-CLOUD',
          hasSousApp: true
        },
        {
          id: 4,
          nomApplication: 'App Delta',
          nomRessourceCloud: 'DELTA-CLOUD',
          hasSousApp: true
        },
        {
          id: 5,
          nomApplication: 'App Epsilon',
          nomRessourceCloud: 'EPSILON-CLOUD',
          hasSousApp: false
        }
      ], { transaction });

      // 2. Insérer les Sous-Applications
      await queryInterface.bulkInsert('sous_applications', [
        // Sous-apps pour App Alpha
        {
          id: 1,
          nomSousApplication: 'Sous-app Alpha 1',
          applicationId: 1
        },
        {
          id: 2,
          nomSousApplication: 'Sous-app Alpha 2',
          applicationId: 1
        },
        // Sous-app pour App Gamma
        {
          id: 3,
          nomSousApplication: 'Sous-app Gamma 1',
          applicationId: 3
        },
        // Sous-app pour App Delta (sans environnements)
        {
          id: 4,
          nomSousApplication: 'Sous-app Delta 1',
          applicationId: 4
        }
      ], { transaction });

      // 3. Insérer les Environnements
      await queryInterface.bulkInsert('environnements', [
        // Environnements pour Sous-app Alpha 1
        {
          id: 1,
          typeEnvironnement: 'PRD',
          idOuvertureEnv: 'DOF-ALPHA-SOUSALPHA1-PRD-01',
          applicationId: 1,
          sousApplicationId: 1
        },
        {
          id: 2,
          typeEnvironnement: 'REC',
          idOuvertureEnv: 'DOF-ALPHA-SOUSALPHA1-REC-01',
          applicationId: 1,
          sousApplicationId: 1
        },
        {
          id: 3,
          typeEnvironnement: 'DEV',
          idOuvertureEnv: 'DOF-ALPHA-SOUSALPHA1-DEV-01',
          applicationId: 1,
          sousApplicationId: 1
        },
        
        // Environnements pour Sous-app Alpha 2
        {
          id: 4,
          typeEnvironnement: 'PRD',
          idOuvertureEnv: 'DOF-ALPHA-SOUSALPHA2-PRD-01',
          applicationId: 1,
          sousApplicationId: 2
        },
        {
          id: 5,
          typeEnvironnement: 'REC',
          idOuvertureEnv: 'DOF-ALPHA-SOUSALPHA2-REC-01',
          applicationId: 1,
          sousApplicationId: 2
        },
        {
          id: 6,
          typeEnvironnement: 'DEV',
          idOuvertureEnv: 'DOF-ALPHA-SOUSALPHA2-DEV-01',
          applicationId: 1,
          sousApplicationId: 2
        },

        // Environnements pour App Beta (directement rattachés à l'application)
        {
          id: 7,
          typeEnvironnement: 'PRD',
          idOuvertureEnv: 'DOF-BETA-PRD-01',
          applicationId: 2,
          sousApplicationId: null
        },
        {
          id: 8,
          typeEnvironnement: 'REC',
          idOuvertureEnv: 'DOF-BETA-REC-01',
          applicationId: 2,
          sousApplicationId: null
        },
        {
          id: 9,
          typeEnvironnement: 'DEV',
          idOuvertureEnv: 'DOF-BETA-DEV-01',
          applicationId: 2,
          sousApplicationId: null
        },

        // Environnements pour Sous-app Gamma 1
        {
          id: 10,
          typeEnvironnement: 'PRD',
          idOuvertureEnv: 'DOF-GAMMA-SOUSGAMMA1-PRD-01',
          applicationId: 3,
          sousApplicationId: 3
        },
        {
          id: 11,
          typeEnvironnement: 'REC',
          idOuvertureEnv: 'DOF-GAMMA-SOUSGAMMA1-REC-01',
          applicationId: 3,
          sousApplicationId: 3
        }

        // App Delta : Sous-app sans environnements
        // App Epsilon : Application sans sous-apps ni environnements
      ], { transaction });

      // 4. Insérer les Versions d'Environnements
      await queryInterface.bulkInsert('version_environnements', [
        // Versions pour tous les environnements
        { id: 1, environnementId: 1, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User1', dateVersion: new Date('2023-10-10') },
        { id: 2, environnementId: 2, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User2', dateVersion: new Date('2023-09-01') },
        { id: 3, environnementId: 3, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User3', dateVersion: new Date('2023-08-15') },
        { id: 4, environnementId: 4, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User4', dateVersion: new Date('2023-10-12') },
        { id: 5, environnementId: 5, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User5', dateVersion: new Date('2023-09-05') },
        { id: 6, environnementId: 6, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User6', dateVersion: new Date('2023-08-20') },
        { id: 7, environnementId: 7, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User7', dateVersion: new Date('2023-10-05') },
        { id: 8, environnementId: 8, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User8', dateVersion: new Date('2023-09-12') },
        { id: 9, environnementId: 9, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User9', dateVersion: new Date('2023-08-30') },
        { id: 10, environnementId: 10, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User10', dateVersion: new Date('2023-10-20') },
        { id: 11, environnementId: 11, numeroVersion: 1, typeAction: 'creation', utilisateurCreateur: 'User11', dateVersion: new Date('2023-09-18') }
      ], { transaction });

      // 5. Insérer des Demandes correspondantes
      await queryInterface.bulkInsert('demandes', [
        { id: 1, nomDemande: 'DOF-ALPHA-SOUSALPHA1-PRD-01', proprietaire: 'User1', dateCreation: new Date('2023-10-10'), environnementId: 1, versionEnvId: 1 },
        { id: 2, nomDemande: 'DOF-ALPHA-SOUSALPHA1-REC-01', proprietaire: 'User2', dateCreation: new Date('2023-09-01'), environnementId: 2, versionEnvId: 2 },
        { id: 3, nomDemande: 'DOF-ALPHA-SOUSALPHA1-DEV-01', proprietaire: 'User3', dateCreation: new Date('2023-08-15'), environnementId: 3, versionEnvId: 3 },
        { id: 4, nomDemande: 'DOF-ALPHA-SOUSALPHA2-PRD-01', proprietaire: 'User4', dateCreation: new Date('2023-10-12'), environnementId: 4, versionEnvId: 4 },
        { id: 5, nomDemande: 'DOF-ALPHA-SOUSALPHA2-REC-01', proprietaire: 'User5', dateCreation: new Date('2023-09-05'), environnementId: 5, versionEnvId: 5 },
        { id: 6, nomDemande: 'DOF-ALPHA-SOUSALPHA2-DEV-01', proprietaire: 'User6', dateCreation: new Date('2023-08-20'), environnementId: 6, versionEnvId: 6 },
        { id: 7, nomDemande: 'DOF-BETA-PRD-01', proprietaire: 'User7', dateCreation: new Date('2023-10-05'), environnementId: 7, versionEnvId: 7 },
        { id: 8, nomDemande: 'DOF-BETA-REC-01', proprietaire: 'User8', dateCreation: new Date('2023-09-12'), environnementId: 8, versionEnvId: 8 },
        { id: 9, nomDemande: 'DOF-BETA-DEV-01', proprietaire: 'User9', dateCreation: new Date('2023-08-30'), environnementId: 9, versionEnvId: 9 },
        { id: 10, nomDemande: 'DOF-GAMMA-SOUSGAMMA1-PRD-01', proprietaire: 'User10', dateCreation: new Date('2023-10-20'), environnementId: 10, versionEnvId: 10 },
        { id: 11, nomDemande: 'DOF-GAMMA-SOUSGAMMA1-REC-01', proprietaire: 'User11', dateCreation: new Date('2023-09-18'), environnementId: 11, versionEnvId: 11 }
      ], { transaction });

      await transaction.commit();
      console.log('✅ Données de démonstration insérées avec succès !');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors de l\'insertion des données de démonstration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Supprimer toutes les données dans l'ordre inverse
      await queryInterface.bulkDelete('matrice_flux', null, { transaction });
      await queryInterface.bulkDelete('groupes', null, { transaction });
      await queryInterface.bulkDelete('tiers', null, { transaction });
      await queryInterface.bulkDelete('composants', null, { transaction });
      await queryInterface.bulkDelete('modifications', null, { transaction });
      await queryInterface.bulkDelete('demandes', null, { transaction });
      await queryInterface.bulkDelete('version_environnements', null, { transaction });
      await queryInterface.bulkDelete('environnements', null, { transaction });
      await queryInterface.bulkDelete('sous_applications', null, { transaction });
      await queryInterface.bulkDelete('applications', null, { transaction });
      
      await transaction.commit();
      console.log('✅ Données de démonstration supprimées avec succès !');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors de la suppression des données de démonstration:', error);
      throw error;
    }
  }
}; 