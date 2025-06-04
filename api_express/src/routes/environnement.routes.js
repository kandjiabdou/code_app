const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

// Récupérer tous les environnements
router.get('/', async (req, res) => {
  try {
    const environnements = await db.Environnement.findAll({
      include: [
        {
          model: db.Application,
          attributes: ['nomApplication', 'nomRessourceCloud']
        },
        {
          model: db.SousApplication,
          attributes: ['nomSousApplication']
        },
        {
          model: db.VersionEnvironnement,
          attributes: ['id', 'numeroVersion', 'typeAction', 'utilisateurCreateur', 'dateVersion']
        },
        {
          model: db.Composant,
          include: [{
            model: db.Tier,
            attributes: ['id', 'typeTier', 'zoneSecurite', 'optionVip']
          }]
        },
        {
          model: db.MatriceFlux
        }
      ]
    });
    res.json(environnements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un nouvel environnement
router.post('/', async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      typeEnvironnement,
      idOuvertureEnv,
      applicationId,
      sousApplicationId,
      composants,
      matriceFlux
    } = req.body;

    // Vérifier l'existence de l'application
    const application = await db.Application.findByPk(applicationId);
    if (!application) {
      return res.status(400).json({ 
        error: "Application introuvable", 
        details: `L'application avec l'ID ${applicationId} n'existe pas dans la base de données.`,
        code: "APPLICATION_NOT_FOUND"
      });
    }

    // Vérifier les sous-applications existantes pour cette application
    const sousApplicationsExistantes = await db.SousApplication.findAll({
      where: { applicationId: applicationId }
    });

    // Règle métier : Si l'application a des sous-applications, l'environnement DOIT être rattaché à une sous-application
    if (sousApplicationsExistantes.length > 0 && !sousApplicationId) {
      return res.status(400).json({ 
        error: "Sous-application obligatoire", 
        details: `L'application "${application.nomApplication}" possède ${sousApplicationsExistantes.length} sous-application(s). Tous les environnements doivent être rattachés à une sous-application et non directement à l'application.`,
        code: "SOUS_APPLICATION_REQUIRED",
        availableSousApplications: sousApplicationsExistantes.map(sa => ({
          id: sa.id,
          nom: sa.nomSousApplication
        }))
      });
    }

    // Règle métier : Si l'application n'a pas de sous-applications, l'environnement ne peut pas être rattaché à une sous-application
    if (sousApplicationsExistantes.length === 0 && sousApplicationId) {
      return res.status(400).json({ 
        error: "Sous-application non autorisée", 
        details: `L'application "${application.nomApplication}" ne possède aucune sous-application. L'environnement doit être rattaché directement à l'application.`,
        code: "NO_SOUS_APPLICATION_ALLOWED"
      });
    }

    // Vérifier l'existence de la sous-application si spécifiée
    let sousApplication = null;
    if (sousApplicationId) {
      sousApplication = await db.SousApplication.findOne({
        where: {
          id: sousApplicationId,
          applicationId: applicationId
        }
      });
      if (!sousApplication) {
        return res.status(400).json({ 
          error: "Sous-application introuvable", 
          details: `La sous-application avec l'ID ${sousApplicationId} n'existe pas ou n'appartient pas à l'application "${application.nomApplication}".`,
          code: "SOUS_APPLICATION_NOT_FOUND",
          availableSousApplications: sousApplicationsExistantes.map(sa => ({
            id: sa.id,
            nom: sa.nomSousApplication
          }))
        });
      }
    }

    // Validation métier : Vérifier l'unicité de l'environnement (Application + Sous-Application + Type d'environnement)
    const existingEnvironnement = await db.Environnement.findOne({
      where: {
        applicationId: applicationId,
        sousApplicationId: sousApplicationId || null,
        typeEnvironnement: typeEnvironnement
      },
      include: [
        {
          model: db.Application,
          attributes: ['nomApplication', 'nomRessourceCloud']
        },
        {
          model: db.SousApplication,
          attributes: ['nomSousApplication']
        }
      ]
    });

    if (existingEnvironnement) {
      const contexte = sousApplication 
        ? `"${application.nomApplication}" → "${sousApplication.nomSousApplication}"`
        : `"${application.nomApplication}"`;
      
      return res.status(409).json({ 
        error: "Environnement déjà existant", 
        details: `Un environnement "${typeEnvironnement}" existe déjà pour ${contexte}. Chaque combinaison Application + Sous-Application + Type d'environnement doit être unique.`,
        code: "ENVIRONMENT_ALREADY_EXISTS",
        existingEnvironment: {
          id: existingEnvironnement.id,
          typeEnvironnement: existingEnvironnement.typeEnvironnement,
          idOuvertureEnv: existingEnvironnement.idOuvertureEnv,
          application: existingEnvironnement.Application?.nomApplication,
          sousApplication: existingEnvironnement.SousApplication?.nomSousApplication
        }
      });
    }

    // Validation métier : Vérifier l'unicité de l'ID d'ouverture d'environnement
    const existingIdOuverture = await db.Environnement.findOne({
      where: { idOuvertureEnv: idOuvertureEnv }
    });

    if (existingIdOuverture) {
      return res.status(409).json({ 
        error: "ID d'ouverture déjà utilisé", 
        details: `L'identifiant d'ouverture "${idOuvertureEnv}" est déjà utilisé par un autre environnement. Chaque ID d'ouverture doit être unique.`,
        code: "ID_OUVERTURE_ALREADY_EXISTS",
        existingEnvironment: {
          id: existingIdOuverture.id,
          idOuvertureEnv: existingIdOuverture.idOuvertureEnv
        }
      });
    }

    // Validation des données de la matrice de flux
    if (matriceFlux && matriceFlux.length > 0) {
      for (let i = 0; i < matriceFlux.length; i++) {
        const flux = matriceFlux[i];
        // Ignorer les lignes vides (tous les champs vides)
        const isEmpty = Object.values(flux).every(value => !value || value.trim() === '');
        if (isEmpty) {
          continue; // Passer les lignes vides
        }

        // Vérifier que les champs obligatoires sont renseignés pour les lignes non vides
        const requiredFields = ['sourceZone', 'destZone', 'protocole', 'port', 'action'];
        const missingFields = requiredFields.filter(field => !flux[field] || flux[field].trim() === '');
        
        if (missingFields.length > 0) {
          return res.status(400).json({ 
            error: "Données de matrice de flux incomplètes", 
            details: `Ligne ${i + 1} de la matrice de flux : les champs suivants sont obligatoires : ${missingFields.join(', ')}.`,
            code: "INCOMPLETE_FLUX_DATA"
          });
        }
      }
    }

    // Créer l'environnement
    const environnement = await db.Environnement.create({
      typeEnvironnement,
      idOuvertureEnv,
      applicationId,
      sousApplicationId
    }, { transaction: t });

    // Créer la première version
    const version = await db.VersionEnvironnement.create({
      environnementId: environnement.id,
      numeroVersion: 1,
      typeAction: 'creation',
      utilisateurCreateur: 'system',
      dateVersion: new Date()
    }, { transaction: t });

    // Créer les composants si fournis
    if (composants?.length > 0) {
      for (const composant of composants) {
        const { tiers, ...composantData } = composant;
        const newComposant = await db.Composant.create({
          ...composantData,
          environnementId: environnement.id,
          applicationId,
          sousApplicationId
        }, { transaction: t });

        // Créer les tiers pour chaque composant
        if (tiers?.length > 0) {
          for (const tier of tiers) {
            const { groupes, ...tierData } = tier;
            const newTier = await db.Tier.create({
              ...tierData,
              composantId: newComposant.id
            }, { transaction: t });

            // Créer les groupes pour chaque tier
            if (groupes) {
              await db.Groupe.create({
                ...groupes,
                tierId: newTier.id
              }, { transaction: t });
            }
          }
        }
      }
    }

    // Créer la matrice de flux si fournie (en filtrant les lignes vides)
    if (matriceFlux?.length > 0) {
      // Filtrer les lignes vides
      const fluxValides = matriceFlux.filter(flux => {
        return flux && Object.values(flux).some(value => value && value.trim() !== '');
      });

      if (fluxValides.length > 0) {
        await db.MatriceFlux.bulkCreate(
          fluxValides.map(flux => ({
            ...flux,
            environnementId: environnement.id
          })),
          { transaction: t }
        );
      }
    }

    await t.commit();

    // Récupérer l'environnement complet avec toutes ses relations
    const environnementComplet = await db.Environnement.findByPk(environnement.id, {
      include: [
        {
          model: db.Application,
          attributes: ['nomApplication', 'nomRessourceCloud']
        },
        {
          model: db.SousApplication,
          attributes: ['nomSousApplication']
        },
        {
          model: db.VersionEnvironnement,
          attributes: ['id', 'numeroVersion', 'typeAction', 'utilisateurCreateur', 'dateVersion']
        },
        {
          model: db.Composant,
          include: [{
            model: db.Tier,
            attributes: ['id', 'typeTier', 'zoneSecurite', 'optionVip']
          }]
        },
        {
          model: db.MatriceFlux
        }
      ]
    });

    res.status(201).json(environnementComplet);
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    res.status(400).json({ error: error.message });
  }
});

// Récupérer un environnement par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const environnement = await db.Environnement.findByPk(parseInt(id), {
      include: [
        {
          model: db.Application,
          attributes: ['nomApplication', 'nomRessourceCloud']
        },
        {
          model: db.SousApplication,
          attributes: ['nomSousApplication']
        },
        {
          model: db.VersionEnvironnement,
          attributes: ['id', 'numeroVersion', 'typeAction', 'utilisateurCreateur', 'dateVersion']
        },
        {
          model: db.Composant,
          include: [{
            model: db.Tier,
            attributes: ['id', 'typeTier', 'zoneSecurite', 'optionVip']
          }]
        },
        {
          model: db.MatriceFlux
        }
      ]
    });

    if (!environnement) {
      return res.status(404).json({ message: 'Environnement non trouvé' });
    }
    res.json(environnement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un environnement
router.put('/:id', async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { typeEnvironnement, idOuvertureEnv, utilisateurCreateur } = req.body;
    
    // Mettre à jour l'environnement
    await db.Environnement.update({
      typeEnvironnement,
      idOuvertureEnv
    }, {
      where: { id: parseInt(id) },
      transaction: t
    });

    // Créer une nouvelle version
    const derniereVersion = await db.VersionEnvironnement.findOne({
      where: { environnementId: id },
      order: [['numeroVersion', 'DESC']],
      transaction: t
    });

    await db.VersionEnvironnement.create({
      environnementId: parseInt(id),
      numeroVersion: derniereVersion.numeroVersion + 1,
      typeAction: 'modification',
      utilisateurCreateur: utilisateurCreateur || 'system',
      dateVersion: new Date()
    }, { transaction: t });

    await t.commit();

    // Récupérer l'environnement mis à jour
    const environnement = await db.Environnement.findByPk(parseInt(id), {
      include: [
        db.VersionEnvironnement,
        db.Composant,
        db.MatriceFlux
      ]
    });
    res.json(environnement);
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    res.status(400).json({ error: error.message });
  }
});

// Supprimer un environnement
router.delete('/:id', async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    await db.Environnement.destroy({
      where: { id: parseInt(id) },
      transaction: t
    });
    await t.commit();
    res.status(204).send();
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 