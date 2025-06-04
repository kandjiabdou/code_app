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
      whereClause = {
        nomApplication: {
          [Op.iLike]: `%${q.trim()}%`
        }
      };
    }

    const applications = await db.Application.findAll({
      where: whereClause,
      attributes: ['id', 'nomApplication', 'nomRessourceCloud', 'hasSousApp'],
      limit: 10, // Limiter les résultats pour l'auto-complétion
      order: [['nomApplication', 'ASC']]
    });

    res.json(applications);
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
    const applications = await db.Application.findAll({
      include: [
        {
          model: db.SousApplication,
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
              db.Composant,
              db.MatriceFlux
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
            db.Composant,
            db.MatriceFlux
          ]
        }
      ]
    });

    // Transformer les données pour le format souhaité
    const formattedApplications = applications.map(app => {
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