const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

// Récupérer toutes les sous-applications
router.get('/', async (req, res) => {
  try {
    const sousApplications = await db.SousApplication.findAll({
      include: [
        {
          model: db.Application,
          attributes: ['nomApplication', 'nomRessourceCloud']
        },
        {
          model: db.Environnement,
          include: [db.Composant]
        }
      ]
    });
    res.json(sousApplications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une nouvelle sous-application
router.post('/', async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { nomSousApplication, applicationId } = req.body;

    // Vérifier si l'application parent existe
    const application = await db.Application.findByPk(parseInt(applicationId));
    if (!application) {
      throw new Error("L'application parent n'existe pas");
    }

    const sousApplication = await db.SousApplication.create({
      nomSousApplication,
      applicationId: parseInt(applicationId)
    }, { transaction: t });

    const sousApplicationComplete = await db.SousApplication.findByPk(sousApplication.id, {
      include: [{
        model: db.Application,
        attributes: ['nomApplication', 'nomRessourceCloud']
      }],
      transaction: t
    });

    await t.commit();
    res.status(201).json(sousApplicationComplete);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

// Récupérer une sous-application par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sousApplication = await db.SousApplication.findByPk(parseInt(id), {
      include: [
        {
          model: db.Application,
          attributes: ['nomApplication', 'nomRessourceCloud']
        },
        {
          model: db.Environnement,
          include: [db.Composant]
        }
      ]
    });
    if (!sousApplication) {
      return res.status(404).json({ message: 'Sous-application non trouvée' });
    }
    res.json(sousApplication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les sous-applications par application ID
router.get('/by-application/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const sousApplications = await db.SousApplication.findAll({
      where: { applicationId: parseInt(applicationId) },
      include: [
        {
          model: db.Environnement,
          include: [db.Composant]
        }
      ]
    });
    res.json(sousApplications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une sous-application
router.put('/:id', async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { nomSousApplication } = req.body;
    
    await db.SousApplication.update({
      nomSousApplication
    }, {
      where: { id: parseInt(id) },
      transaction: t
    });

    const sousApplication = await db.SousApplication.findByPk(parseInt(id), {
      include: [{
        model: db.Application,
        attributes: ['nomApplication', 'nomRessourceCloud']
      }],
      transaction: t
    });

    await t.commit();
    res.json(sousApplication);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une sous-application
router.delete('/:id', async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    await db.SousApplication.destroy({
      where: { id: parseInt(id) },
      transaction: t
    });
    await t.commit();
    res.status(204).send();
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 