const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

// Recherche d'applications avec auto-complétion
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query; // Paramètre de recherche
    
    let whereClause = {};
    if (q && q.trim() !== '') {
      const searchTerm = q.trim();
      whereClause = {
        [Op.or]: [
          {
            nomApplication: {
              [Op.like]: `%${searchTerm}%`
            }
          },
          {
            nomRessourceCloud: {
              [Op.like]: `%${searchTerm}%`
            }
          }
        ]
      };
    }

    const applications = await db.Application.findAll({
      where: whereClause,
      attributes: ['id', 'nomApplication', 'nomRessourceCloud', 'hasSousApp'],
      include: [
        {
          model: db.SousApplication,
          attributes: ['id', 'nomSousApplication'],
          required: false,
          include: [{
            model: db.Environnement,
            attributes: ['id', 'typeEnvironnement']
          }]
        },
        {
          model: db.Environnement,
          attributes: ['id', 'typeEnvironnement'],
          where: {
            sousApplicationId: null
          },
          required: false
        }
      ],
      limit: 10, // Limiter les résultats pour l'auto-complétion
      order: [['nomApplication', 'ASC']]
    });

    // Transformer les données pour inclure les environnements disponibles
    const formattedApplications = applications.map(app => {
      const plainApp = app.get({ plain: true });
      const allEnvironnements = ['POC', 'DEV', 'REC', 'PPR', 'PRD'];
      
      let result = {
        id: plainApp.id,
        nomApplication: plainApp.nomApplication,
        nomRessourceCloud: plainApp.nomRessourceCloud,
        hasSousApp: plainApp.hasSousApp,
        sousApplications: [],
        environnementsDisponibles: []
      };

      if (plainApp.hasSousApp && plainApp.SousApplications?.length > 0) {
        // Application avec sous-applications
        result.sousApplications = plainApp.SousApplications.map(sousApp => {
          const environnementsExistants = sousApp.Environnements?.map(env => env.typeEnvironnement) || [];
          return {
            id: sousApp.id,
            nomSousApplication: sousApp.nomSousApplication,
            environnementsExistants,
            environnementsDisponibles: allEnvironnements.filter(env => !environnementsExistants.includes(env))
          };
        });
      } else {
        // Application sans sous-applications
        const environnementsExistants = plainApp.Environnements?.map(env => env.typeEnvironnement) || [];
        result.environnementsDisponibles = allEnvironnements.filter(env => !environnementsExistants.includes(env));
        result.environnementsExistants = environnementsExistants;
      }

      return result;
    });

    res.json(formattedApplications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les détails complets d'une application avec ses sous-applications et environnements
router.get('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await db.Application.findByPk(parseInt(id), {
      include: [
        {
          model: db.SousApplication,
          attributes: ['id', 'nomSousApplication'],
          include: [
            {
              model: db.Environnement,
              attributes: ['id', 'typeEnvironnement', 'idOuvertureEnv'],
              include: [
                {
                  model: db.VersionEnvironnement,
                  attributes: ['id', 'numeroVersion', 'dateVersion', 'utilisateurCreateur'],
                  order: [['numeroVersion', 'DESC']],
                  limit: 1
                },
                {
                  model: db.Demande,
                  attributes: ['id', 'nomDemande', 'proprietaire', 'dateCreation'],
                  limit: 1
                }
              ]
            }
          ]
        },
        {
          model: db.Environnement,
          where: { sousApplicationId: null },
          required: false,
          attributes: ['id', 'typeEnvironnement', 'idOuvertureEnv'],
          include: [
            {
              model: db.VersionEnvironnement,
              attributes: ['id', 'numeroVersion', 'dateVersion', 'utilisateurCreateur'],
              order: [['numeroVersion', 'DESC']],
              limit: 1
            },
            {
              model: db.Demande,
              attributes: ['id', 'nomDemande', 'proprietaire', 'dateCreation'],
              limit: 1
            }
          ]
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ message: 'Application non trouvée' });
    }

    // Restructurer les données pour être plus facilement utilisables côté front
    const result = {
      id: application.id,
      nomApplication: application.nomApplication,
      nomRessourceCloud: application.nomRessourceCloud,
      hasSousApp: application.hasSousApp,
      sousApplications: application.SousApplications?.map(sousApp => ({
        id: sousApp.id,
        nomSousApplication: sousApp.nomSousApplication,
        environnements: sousApp.Environnements?.map(env => ({
          id: env.id,
          typeEnvironnement: env.typeEnvironnement,
          idOuvertureEnv: env.idOuvertureEnv,
          version: env.VersionEnvironnements?.[0]?.numeroVersion || null,
          dateCreation: env.VersionEnvironnements?.[0]?.dateVersion || null,
          proprietaire: env.Demandes?.[0]?.proprietaire || null,
          nomDemande: env.Demandes?.[0]?.nomDemande || null
        })) || [],
        environnementsDisponibles: ['POC', 'DEV', 'REC', 'PPR', 'PRD'].filter(envType => 
          !sousApp.Environnements?.some(env => env.typeEnvironnement === envType)
        )
      })) || [],
      environnementsDirecs: application.Environnements?.map(env => ({
        id: env.id,
        typeEnvironnement: env.typeEnvironnement,
        idOuvertureEnv: env.idOuvertureEnv,
        version: env.VersionEnvironnements?.[0]?.numeroVersion || null,
        dateCreation: env.VersionEnvironnements?.[0]?.dateVersion || null,
        proprietaire: env.Demandes?.[0]?.proprietaire || null,
        nomDemande: env.Demandes?.[0]?.nomDemande || null
      })) || [],
      environnementsDirectsDisponibles: ['POC', 'DEV', 'REC', 'PPR', 'PRD'].filter(envType => 
        !application.Environnements?.some(env => env.typeEnvironnement === envType)
      )
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer toutes les applications
router.get('/', async (req, res) => {
  try {
    const { q } = req.query; // Paramètre de recherche
    
    let whereClause = {};
    let sousAppWhereClause = {};
    
    if (q && q.trim() !== '') {
      const searchTerm = q.trim();
      
      // Recherche dans les applications (nom application OU nom ressource cloud)
      whereClause = {
        [Op.or]: [
          {
            nomApplication: {
              [Op.like]: `%${searchTerm}%`
            }
          },
          {
            nomRessourceCloud: {
              [Op.like]: `%${searchTerm}%`
            }
          }
        ]
      };
      
      // Recherche dans les sous-applications
      sousAppWhereClause = {
        nomSousApplication: {
          [Op.like]: `%${searchTerm}%`
        }
      };
    }

    // 1. Récupérer les applications qui matchent directement (nom app ou ressource cloud)
    const directMatchApps = await db.Application.findAll({
      where: whereClause,
      limit: 10,
      order: [['nomApplication', 'ASC']],
      include: [
        {
          model: db.SousApplication,
          required: false, // LEFT JOIN pour inclure toutes les sous-apps
          include: [{
            model: db.Environnement,
            include: [
              {
                model: db.VersionEnvironnement,
                limit: 1,
                order: [['numeroVersion', 'DESC']],
              },
              {
                model: db.Demande,
                limit: 1,
                order: [['dateCreation', 'DESC']],
              },
            ]
          }]
        },
        {
          model: db.Environnement,
          where: {
            sousApplicationId: null
          },
          required: false,
          include: [
            {
              model: db.VersionEnvironnement,
              limit: 1,
              order: [['numeroVersion', 'DESC']],
            },
            {
              model: db.Demande,
              limit: 1,
              order: [['dateCreation', 'DESC']],
            },
          ]
        }
      ]
    });

    // 2. Si on recherche et qu'on a encore de la place, chercher les applications avec sous-apps qui matchent
    let sousAppMatchApps = [];
    if (q && q.trim() !== '' && directMatchApps.length < 10) {
      const directMatchAppIds = directMatchApps.map(app => app.id);
      
      sousAppMatchApps = await db.Application.findAll({
        where: directMatchAppIds.length > 0 ? {
          id: {
            [Op.notIn]: directMatchAppIds
          }
        } : {},
        limit: Math.max(0, 10 - directMatchApps.length),
        order: [['nomApplication', 'ASC']],
        include: [
          {
            model: db.SousApplication,
            where: sousAppWhereClause,
            required: true, // INNER JOIN pour n'avoir que les apps avec sous-apps correspondantes
            include: [{
              model: db.Environnement,
              include: [
                {
                  model: db.VersionEnvironnement,
                  limit: 1,
                  order: [['numeroVersion', 'DESC']],
                },
                {
                  model: db.Demande,
                  limit: 1,
                  order: [['dateCreation', 'DESC']],
                },
              ]
            }]
          },
          {
            model: db.Environnement,
            where: {
              sousApplicationId: null
            },
            required: false,
            include: [
              {
                model: db.VersionEnvironnement,
                limit: 1,
                order: [['numeroVersion', 'DESC']],
              },
              {
                model: db.Demande,
                limit: 1,
                order: [['dateCreation', 'DESC']],
              },
            ]
          }
        ]
      });
    }

    // 3. Combiner les résultats
    const allApplications = [...directMatchApps, ...sousAppMatchApps];

    // Transformer les données pour le format souhaité
    const formattedApplications = allApplications.map(app => {
      const plainApp = app.get({ plain: true });
      return {
        ...plainApp,
        sousApplications: plainApp.hasSousApp ? plainApp.SousApplications : null,
        environnements: plainApp.hasSousApp ? null : plainApp.Environnements
      };
    });

    res.json(formattedApplications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une nouvelle application
router.post('/', async (req, res) => {
  try {
    const { nomApplication, nomRessourceCloud, hasSousApp } = req.body;
    const application = await db.Application.create({
      nomApplication,
      nomRessourceCloud,
      hasSousApp
    });
    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Récupérer une application par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await db.Application.findByPk(parseInt(id), {
      include: [
        {
          model: db.SousApplication,
          include: [db.Environnement]
        },
        db.Environnement,
        db.Composant
      ]
    });
    
    if (!application) {
      return res.status(404).json({ message: 'Application non trouvée' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une application
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nomApplication, nomRessourceCloud, hasSousApp } = req.body;
    const application = await db.Application.update({
      nomApplication,
      nomRessourceCloud,
      hasSousApp
    }, {
      where: { id: parseInt(id) },
      returning: true
    });
    
    const updatedApplication = await db.Application.findByPk(parseInt(id));
    res.json(updatedApplication);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une application
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.Application.destroy({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 