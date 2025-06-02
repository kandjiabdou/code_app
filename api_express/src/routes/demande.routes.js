const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer toutes les demandes
router.get('/', async (req, res) => {
  try {
    const demandes = await prisma.demande.findMany({
      include: {
        environnement: true,
        versionEnv: true
      }
    });
    res.json(demandes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une nouvelle demande
router.post('/', async (req, res) => {
  try {
    const { nomDemande, proprietaire, environnementId, versionEnvId } = req.body;
    const demande = await prisma.demande.create({
      data: {
        nomDemande,
        proprietaire,
        environnementId: parseInt(environnementId),
        versionEnvId: parseInt(versionEnvId)
      },
      include: {
        environnement: true,
        versionEnv: true
      }
    });
    res.status(201).json(demande);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Récupérer une demande par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id) },
      include: {
        environnement: {
          include: {
            application: true,
            sousApplication: true
          }
        },
        versionEnv: {
          include: {
            modifications: true
          }
        }
      }
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
  try {
    const { id } = req.params;
    const { nomDemande, proprietaire } = req.body;
    const demande = await prisma.demande.update({
      where: { id: parseInt(id) },
      data: {
        nomDemande,
        proprietaire
      }
    });
    res.json(demande);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une demande
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.demande.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 