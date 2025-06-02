const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer toutes les entrées de la matrice de flux
router.get('/', async (req, res) => {
  try {
    const matriceFlux = await prisma.matriceFlux.findMany({
      include: {
        environnement: true
      }
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
    const matriceFlux = await prisma.matriceFlux.findMany({
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

    const flux = await prisma.matriceFlux.create({
      data: {
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
      }
    });
    res.status(201).json(flux);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mettre à jour une entrée de la matrice de flux
router.put('/:id', async (req, res) => {
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

    const flux = await prisma.matriceFlux.update({
      where: { id: parseInt(id) },
      data: {
        sourceZone,
        sourceDesignation,
        sourceGroupe,
        destZone,
        destDesignation,
        destGroupe,
        protocole,
        port,
        action
      }
    });
    res.json(flux);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une entrée de la matrice de flux
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.matriceFlux.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 