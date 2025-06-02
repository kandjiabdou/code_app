const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer toutes les sous-applications
router.get('/', async (req, res) => {
  try {
    const sousApplications = await prisma.sousApplication.findMany({
      include: {
        application: true,
        environnements: true,
        composants: true
      }
    });
    res.json(sousApplications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une nouvelle sous-application
router.post('/', async (req, res) => {
  try {
    const { nomSousApplication, applicationId } = req.body;

    // Vérifier si l'application parent existe
    const application = await prisma.application.findUnique({
      where: { id: parseInt(applicationId) }
    });

    if (!application) {
      return res.status(404).json({ error: "L'application parent n'existe pas" });
    }

    const sousApplication = await prisma.sousApplication.create({
      data: {
        nomSousApplication,
        applicationId: parseInt(applicationId)
      },
      include: {
        application: true
      }
    });
    res.status(201).json(sousApplication);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Récupérer une sous-application par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sousApplication = await prisma.sousApplication.findUnique({
      where: { id: parseInt(id) },
      include: {
        application: true,
        environnements: true,
        composants: true
      }
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
    const sousApplications = await prisma.sousApplication.findMany({
      where: { applicationId: parseInt(applicationId) },
      include: {
        environnements: true,
        composants: true
      }
    });
    res.json(sousApplications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une sous-application
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nomSousApplication } = req.body;
    const sousApplication = await prisma.sousApplication.update({
      where: { id: parseInt(id) },
      data: { nomSousApplication },
      include: {
        application: true
      }
    });
    res.json(sousApplication);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une sous-application
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.sousApplication.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 