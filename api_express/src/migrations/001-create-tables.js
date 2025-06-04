'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Table Applications
      await queryInterface.createTable('applications', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nomApplication: {
          type: Sequelize.STRING,
          allowNull: false
        },
        nomRessourceCloud: {
          type: Sequelize.STRING,
          allowNull: false
        },
        hasSousApp: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }
      }, { transaction });

      // Table Sous-Applications
      await queryInterface.createTable('sous_applications', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nomSousApplication: {
          type: Sequelize.STRING,
          allowNull: false
        },
        applicationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'applications',
            key: 'id'
          },
          onDelete: 'CASCADE'
        }
      }, { transaction });

      // Table Environnements
      await queryInterface.createTable('environnements', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        typeEnvironnement: {
          type: Sequelize.STRING,
          allowNull: false
        },
        idOuvertureEnv: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        applicationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'applications',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        sousApplicationId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'sous_applications',
            key: 'id'
          },
          onDelete: 'CASCADE'
        }
      }, { transaction });

      // Table Version Environnements
      await queryInterface.createTable('version_environnements', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        environnementId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'environnements',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        numeroVersion: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        typeAction: {
          type: Sequelize.STRING,
          allowNull: false
        },
        utilisateurCreateur: {
          type: Sequelize.STRING,
          allowNull: false
        },
        dateVersion: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Table Demandes
      await queryInterface.createTable('demandes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nomDemande: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        proprietaire: {
          type: Sequelize.STRING,
          allowNull: false
        },
        dateCreation: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        environnementId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'environnements',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        versionEnvId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'version_environnements',
            key: 'id'
          },
          onDelete: 'CASCADE'
        }
      }, { transaction });

      // Table Modifications
      await queryInterface.createTable('modifications', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        versionEnvId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'version_environnements',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        typeModification: {
          type: Sequelize.STRING,
          allowNull: false
        },
        elementModifie: {
          type: Sequelize.STRING,
          allowNull: false
        },
        ancienneValeur: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        nouvelleValeur: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        utilisateurModificateur: {
          type: Sequelize.STRING,
          allowNull: false
        },
        dateModification: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Table Composants
      await queryInterface.createTable('composants', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        environnementId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'environnements',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        typeComposantTiers: {
          type: Sequelize.STRING,
          allowNull: false
        },
        nomComposant: {
          type: Sequelize.STRING,
          allowNull: false
        },
        nomNetworkGroupVra: {
          type: Sequelize.STRING,
          allowNull: false
        },
        applicationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'applications',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        sousApplicationId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'sous_applications',
            key: 'id'
          },
          onDelete: 'CASCADE'
        }
      }, { transaction });

      // Table Tiers
      await queryInterface.createTable('tiers', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        typeTier: {
          type: Sequelize.STRING,
          allowNull: false
        },
        zoneSecurite: {
          type: Sequelize.STRING,
          allowNull: false
        },
        optionVip: {
          type: Sequelize.STRING,
          allowNull: false
        },
        composantId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'composants',
            key: 'id'
          },
          onDelete: 'CASCADE'
        }
      }, { transaction });

      // Table Groupes
      await queryInterface.createTable('groupes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        groupServeurs: {
          type: Sequelize.STRING,
          allowNull: false
        },
        groupVIP: {
          type: Sequelize.STRING,
          allowNull: true
        },
        groupSNAT: {
          type: Sequelize.STRING,
          allowNull: true
        },
        tierId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'tiers',
            key: 'id'
          },
          onDelete: 'CASCADE'
        }
      }, { transaction });

      // Table Matrice Flux
      await queryInterface.createTable('matrice_flux', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        sourceZone: {
          type: Sequelize.STRING,
          allowNull: false
        },
        sourceDesignation: {
          type: Sequelize.STRING,
          allowNull: false
        },
        sourceGroupe: {
          type: Sequelize.STRING,
          allowNull: false
        },
        destZone: {
          type: Sequelize.STRING,
          allowNull: false
        },
        destDesignation: {
          type: Sequelize.STRING,
          allowNull: false
        },
        destGroupe: {
          type: Sequelize.STRING,
          allowNull: false
        },
        protocole: {
          type: Sequelize.STRING,
          allowNull: false
        },
        port: {
          type: Sequelize.STRING,
          allowNull: false
        },
        action: {
          type: Sequelize.STRING,
          allowNull: false
        },
        environnementId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'environnements',
            key: 'id'
          },
          onDelete: 'CASCADE'
        }
      }, { transaction });

      // Table Affectation Groupes
      await queryInterface.createTable('affectation_groupes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        environnementId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'environnements',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        groupeService: {
          type: Sequelize.STRING,
          allowNull: false
        },
        typeAffectation: {
          type: Sequelize.STRING,
          allowNull: false
        }
      }, { transaction });

      // Table Groupe Consommateur
      await queryInterface.createTable('groupe_consommateurs', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nomGroupe: {
          type: Sequelize.STRING,
          allowNull: false
        },
        affectationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'affectation_groupes',
            key: 'id'
          },
          onDelete: 'CASCADE'
        }
      }, { transaction });

      await transaction.commit();
      console.log('✅ Tables créées avec succès !');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors de la création des tables:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Supprimer les tables dans l'ordre inverse des dépendances
      await queryInterface.dropTable('groupe_consommateurs', { transaction });
      await queryInterface.dropTable('affectation_groupes', { transaction });
      await queryInterface.dropTable('matrice_flux', { transaction });
      await queryInterface.dropTable('groupes', { transaction });
      await queryInterface.dropTable('tiers', { transaction });
      await queryInterface.dropTable('composants', { transaction });
      await queryInterface.dropTable('modifications', { transaction });
      await queryInterface.dropTable('demandes', { transaction });
      await queryInterface.dropTable('version_environnements', { transaction });
      await queryInterface.dropTable('environnements', { transaction });
      await queryInterface.dropTable('sous_applications', { transaction });
      await queryInterface.dropTable('applications', { transaction });
      
      await transaction.commit();
      console.log('✅ Tables supprimées avec succès !');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors de la suppression des tables:', error);
      throw error;
    }
  }
}; 