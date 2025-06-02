const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer tous les environnements
router.get('/', async (req, res) => {
  try {
    const environnements = await prisma.environnement.findMany({
      include: {
        application: true,
        sousApplication: true,
        versions: true,
        composants: true,
        matriceFlux: true
      }
    });
    res.json(environnements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un nouvel environnement
router.post('/', async (req, res) => {
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
    const application = await prisma.application.findUnique({
      where: { id: parseInt(applicationId) }
    });

    if (!application) {
      return res.status(404).json({ error: "L'application spécifiée n'existe pas" });
    }

    // Vérifier l'existence de la sous-application si spécifiée
    if (sousApplicationId) {
      const sousApplication = await prisma.sousApplication.findUnique({
        where: { id: parseInt(sousApplicationId) }
      });

      if (!sousApplication) {
        return res.status(404).json({ error: "La sous-application spécifiée n'existe pas" });
      }

      if (sousApplication.applicationId !== parseInt(applicationId)) {
        return res.status(400).json({ error: "La sous-application n'appartient pas à l'application spécifiée" });
      }
    }

    // 1. Créer l'environnement avec sa première version
    const environnement = await prisma.environnement.create({
      data: {
        typeEnvironnement,
        idOuvertureEnv,
        application: {
          connect: { id: parseInt(applicationId) }
        },
        ...(sousApplicationId && {
          sousApplication: {
            connect: { id: parseInt(sousApplicationId) }
          }
        }),
        versions: {
          create: {
            numeroVersion: 1,
            typeAction: 'creation',
            utilisateurCreateur: 'system',
            dateVersion: new Date()
          }
        }
      },
      include: {
        versions: true
      }
    });

    // 2. Créer les composants avec leurs tiers et groupes
    if (composants && composants.length > 0) {
      await Promise.all(composants.map(async composant => {
        const { tiers, ...composantData } = composant;
        const createdComposant = await prisma.composant.create({
          data: {
            typeComposantTiers: composantData.type,
            nomComposant: composantData.nomComposant,
            nomNetworkGroupVra: composantData.nomNetworkGroupVRA,
            environnement: {
              connect: { id: environnement.id }
            },
            application: {
              connect: { id: parseInt(applicationId) }
            },
            sousApplication: sousApplicationId ? {
              connect: { id: parseInt(sousApplicationId) }
            } : undefined
          }
        });

        // Créer les tiers pour chaque composant
        if (tiers && tiers.length > 0) {
          await Promise.all(tiers.map(async tier => {
            const createdTier = await prisma.tier.create({
              data: {
                typeTier: tier.type,
                zoneSecurite: tier.zoneSecurite,
                optionVip: tier.optionVIP,
                composant: {
                  connect: { id: createdComposant.id }
                }
              }
            });

            // Créer les groupes pour chaque tier
            if (tier.groups) {
              await prisma.groupe.create({
                data: {
                  groupeServeur: tier.groups.groupServeurs,
                  groupeVip: tier.groups.groupVIP,
                  groupeSnat: tier.groups.groupSNAT,
                  tier: {
                    connect: { id: createdTier.id }
                  }
                }
              });
            }
          }));
        }
      }));
    }

    // 3. Créer la matrice de flux
    if (matriceFlux && matriceFlux.length > 0) {
      await Promise.all(matriceFlux.map(flux =>
        prisma.matriceFlux.create({
          data: {
            sourceZone: flux.sourceZone,
            sourceDesignation: flux.sourceDesignation,
            sourceGroupe: flux.sourceGroup,
            destZone: flux.destZone,
            destDesignation: flux.destDesignation,
            destGroupe: flux.destGroup,
            protocole: flux.protocol,
            port: flux.port,
            action: flux.action,
            environnement: {
              connect: { id: environnement.id }
            }
          }
        })
      ));
    }

    // 4. Récupérer l'environnement complet avec toutes ses relations
    const environnementComplet = await prisma.environnement.findUnique({
      where: { id: environnement.id },
      include: {
        application: true,
        sousApplication: true,
        versions: true,
        composants: {
          include: {
            tiers: {
              include: {
                groupes: true
              }
            }
          }
        },
        matriceFlux: true
      }
    });

    res.status(201).json(environnementComplet);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(400).json({ error: error.message });
  }
});

// Récupérer un environnement par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const environnement = await prisma.environnement.findUnique({
      where: { id: parseInt(id) },
      include: {
        application: true,
        sousApplication: true,
        versions: {
          include: {
            modifications: true
          }
        },
        composants: {
          include: {
            tiers: {
              include: {
                groupes: true
              }
            }
          }
        },
        matriceFlux: true,
        affectationGroupes: {
          include: {
            groupesConsommateurs: true
          }
        }
      }
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
  try {
    const { id } = req.params;
    const { typeEnvironnement, idOuvertureEnv } = req.body;
    
    const environnement = await prisma.environnement.update({
      where: { id: parseInt(id) },
      data: {
        typeEnvironnement,
        idOuvertureEnv,
        versions: {
          create: {
            numeroVersion: {
              increment: 1
            },
            typeAction: 'modification',
            utilisateurCreateur: req.body.utilisateurCreateur || 'system'
          }
        }
      },
      include: {
        versions: true
      }
    });
    res.json(environnement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer un environnement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.environnement.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 