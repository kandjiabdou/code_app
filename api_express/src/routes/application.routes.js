const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer toutes les applications
router.get('/', async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        sousApplications: {
          include: {
            environnements: {
              include: {
                versions: {
                  orderBy: {
                    numeroVersion: 'desc'
                  },
                  take: 1
                },
                demandes: {
                  orderBy: {
                    dateCreation: 'desc'
                  },
                  take: 1
                },
                composants: true,
                matriceFlux: true
              }
            }
          }
        },
        environnements: {
          where: {
            sousApplicationId: null
          },
          include: {
            versions: {
              orderBy: {
                numeroVersion: 'desc'
              },
              take: 1
            },
            demandes: {
              orderBy: {
                dateCreation: 'desc'
              },
              take: 1
            },
            composants: true,
            matriceFlux: true
          }
        }
      }
    });

    // Transformer les données pour le format souhaité
    const formattedApplications = applications.map(app => ({
      ...app,
      sousApplications: app.hasSousApp ? app.sousApplications : null,
      environnements: app.hasSousApp ? null : app.environnements
    }));

    res.json(formattedApplications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une nouvelle application
router.post('/', async (req, res) => {
  try {
    const { nomApplication, nomRessourceCloud, hasSousApp } = req.body;
    const application = await prisma.application.create({
      data: {
        nomApplication,
        nomRessourceCloud,
        hasSousApp
      }
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
    const application = await prisma.application.findUnique({
      where: { id: parseInt(id) },
      include: {
        sousApplications: true,
        environnements: true,
        composants: true
      }
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
    const application = await prisma.application.update({
      where: { id: parseInt(id) },
      data: {
        nomApplication,
        nomRessourceCloud,
        hasSousApp
      }
    });
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une application
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.application.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 