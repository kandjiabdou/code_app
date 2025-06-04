const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

// Récupérer toutes les demandes
router.get('/', async (req, res) => {
  try {
    const demandes = await db.Demande.findAll({
      include: [
        {
          model: db.Environnement,
          include: [{
            model: db.Application,
            attributes: ['nomApplication']
          }]
        },
        {
          model: db.VersionEnvironnement,
          attributes: ['numeroVersion', 'typeAction', 'dateVersion']
        }
      ]
    });
    res.json(demandes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une nouvelle demande
router.post('/', async (req, res) => {
  const t = await db.sequelize.transaction();
  let committed = false;
  
  try {
    const { nomDemande, proprietaire, environnementId, versionEnvId } = req.body;
    
    // Vérifier si l'environnement existe
    const environnement = await db.Environnement.findByPk(environnementId);
    if (!environnement) {
      throw new Error("L'environnement spécifié n'existe pas");
    }

    // Vérifier si la version existe
    const versionEnv = await db.VersionEnvironnement.findByPk(versionEnvId);
    if (!versionEnv) {
      throw new Error("La version spécifiée n'existe pas");
    }

    const demande = await db.Demande.create({
      nomDemande,
      proprietaire,
      environnementId: parseInt(environnementId),
      versionEnvId: parseInt(versionEnvId)
    }, { transaction: t });

    await t.commit();
    committed = true;

    // Récupérer la demande complète après le commit
    const demandeComplete = await db.Demande.findByPk(demande.id, {
      include: [
        {
          model: db.Environnement,
          include: [{
            model: db.Application,
            attributes: ['nomApplication']
          }]
        },
        {
          model: db.VersionEnvironnement,
          attributes: ['numeroVersion', 'typeAction', 'dateVersion']
        }
      ]
    });

    res.status(201).json(demandeComplete);
  } catch (error) {
    // Ne faire rollback que si la transaction n'a pas été committée
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Erreur lors du rollback:', rollbackError);
      }
    }
    res.status(400).json({ error: error.message });
  }
});

// Récupérer une demande par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const demande = await db.Demande.findByPk(parseInt(id), {
      include: [
        {
          model: db.Environnement,
          include: [{
            model: db.Application,
            attributes: ['nomApplication']
          }]
        },
        {
          model: db.VersionEnvironnement,
          attributes: ['numeroVersion', 'typeAction', 'dateVersion']
        }
      ]
    });
    
    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }
    res.json(demande);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une demande
router.put('/:id', async (req, res) => {
  const t = await db.sequelize.transaction();
  let committed = false;
  
  try {
    const { id } = req.params;
    const { nomDemande, proprietaire } = req.body;
    
    await db.Demande.update({
      nomDemande,
      proprietaire
    }, {
      where: { id: parseInt(id) },
      transaction: t
    });

    const demande = await db.Demande.findByPk(parseInt(id), {
      include: [
        {
          model: db.Environnement,
          include: [{
            model: db.Application,
            attributes: ['nomApplication']
          }]
        },
        {
          model: db.VersionEnvironnement,
          attributes: ['numeroVersion', 'typeAction', 'dateVersion']
        }
      ],
      transaction: t
    });

    await t.commit();
    committed = true;
    
    res.json(demande);
  } catch (error) {
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Erreur lors du rollback:', rollbackError);
      }
    }
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une demande
router.delete('/:id', async (req, res) => {
  const t = await db.sequelize.transaction();
  let committed = false;
  
  try {
    const { id } = req.params;
    await db.Demande.destroy({
      where: { id: parseInt(id) },
      transaction: t
    });
    
    await t.commit();
    committed = true;
    
    res.status(204).send();
  } catch (error) {
    if (!committed) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Erreur lors du rollback:', rollbackError);
      }
    }
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 