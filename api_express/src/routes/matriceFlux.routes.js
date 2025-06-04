const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

// Récupérer toutes les entrées de la matrice de flux
router.get('/', async (req, res) => {
  try {
    const matriceFlux = await db.MatriceFlux.findAll({
      include: [{
        model: db.Environnement,
        attributes: ['typeEnvironnement', 'idOuvertureEnv']
      }]
    });
    res.json(matriceFlux);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer la matrice de flux par environnement
router.get('/environnement/:environnementId', async (req, res) => {
  try {
    const { environnementId } = req.params;
    const matriceFlux = await db.MatriceFlux.findAll({
      where: {
        environnementId: parseInt(environnementId)
      }
    });
    res.json(matriceFlux);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une nouvelle entrée dans la matrice de flux
router.post('/', async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      sourceZone,
      sourceDesignation,
      sourceGroupe,
      destZone,
      destDesignation,
      destGroupe,
      protocole,
      port,
      action,
      environnementId
    } = req.body;

    const flux = await db.MatriceFlux.create({
      sourceZone,
      sourceDesignation,
      sourceGroupe,
      destZone,
      destDesignation,
      destGroupe,
      protocole,
      port,
      action,
      environnementId: parseInt(environnementId)
    }, { transaction: t });

    await t.commit();
    res.status(201).json(flux);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

// Mettre à jour une entrée de la matrice de flux
router.put('/:id', async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      sourceZone,
      sourceDesignation,
      sourceGroupe,
      destZone,
      destDesignation,
      destGroupe,
      protocole,
      port,
      action
    } = req.body;

    await db.MatriceFlux.update({
      sourceZone,
      sourceDesignation,
      sourceGroupe,
      destZone,
      destDesignation,
      destGroupe,
      protocole,
      port,
      action
    }, {
      where: { id: parseInt(id) },
      transaction: t
    });

    const flux = await db.MatriceFlux.findByPk(parseInt(id), { transaction: t });
    await t.commit();
    res.json(flux);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une entrée de la matrice de flux
router.delete('/:id', async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    await db.MatriceFlux.destroy({
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