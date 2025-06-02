# API Express pour la Gestion des Demandes d'Ouverture de Flux

Cette API permet de gérer les demandes d'ouverture de flux, les applications, les environnements et les matrices de flux.

## Prérequis

- Node.js (v14 ou supérieur)
- MySQL (v8 ou supérieur)
- npm ou yarn

## Installation

1. Cloner le projet
2. Installer les dépendances :
```bash
npm install
```

3. Configurer la base de données :
   - Créer une base de données MySQL nommée `flux_db`
   - Copier le fichier `.env.example` en `.env`
   - Modifier les informations de connexion dans le fichier `.env`

4. Initialiser la base de données :
```bash
npx prisma migrate dev
```

## Démarrage

Pour démarrer l'API en mode développement :
```bash
npm run dev
```

L'API sera accessible à l'adresse : http://localhost:3000

## Points d'API

### Applications
- GET /api/applications - Liste toutes les applications
- POST /api/applications - Crée une nouvelle application
- GET /api/applications/:id - Récupère une application par ID
- PUT /api/applications/:id - Met à jour une application
- DELETE /api/applications/:id - Supprime une application

### Demandes
- GET /api/demandes - Liste toutes les demandes
- POST /api/demandes - Crée une nouvelle demande
- GET /api/demandes/:id - Récupère une demande par ID
- PUT /api/demandes/:id - Met à jour une demande
- DELETE /api/demandes/:id - Supprime une demande

### Environnements
- GET /api/environnements - Liste tous les environnements
- POST /api/environnements - Crée un nouvel environnement
- GET /api/environnements/:id - Récupère un environnement par ID
- PUT /api/environnements/:id - Met à jour un environnement
- DELETE /api/environnements/:id - Supprime un environnement

### Matrice de Flux
- GET /api/matrice-flux - Liste toutes les entrées de la matrice
- GET /api/matrice-flux/environnement/:environnementId - Liste les flux d'un environnement
- POST /api/matrice-flux - Crée une nouvelle entrée de flux
- PUT /api/matrice-flux/:id - Met à jour une entrée de flux
- DELETE /api/matrice-flux/:id - Supprime une entrée de flux

## Structure de la Base de Données

La base de données suit le modèle conceptuel de données (MCD) fourni, avec les tables suivantes :
- applications
- sous_applications
- environnements
- version_environnement
- demandes
- modifications
- composants
- tiers
- groupes
- affectation_groupes
- groupe_consommateurs
- matrice_flux

## Développement

Pour générer de nouveaux modèles Prisma après modification du schéma :
```bash
npx prisma generate
```

Pour créer une nouvelle migration :
```bash
npx prisma migrate dev --name nom_de_la_migration
``` 