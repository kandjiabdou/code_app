const express = require('express');
const cors = require('cors');
const db = require('./models');
const applicationRoutes = require('./routes/application.routes');
const sousApplicationRoutes = require('./routes/sousApplication.routes');
const demandeRoutes = require('./routes/demande.routes');
const environnementRoutes = require('./routes/environnement.routes');
const matriceFluxRoutes = require('./routes/matriceFlux.routes');

const app = express();
const port = process.env.PORT || 5500;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/applications', applicationRoutes);
app.use('/api/sous-applications', sousApplicationRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/environnements', environnementRoutes);
app.use('/api/matrice-flux', matriceFluxRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur est survenue !' });
});

// Synchronisation de la base de données
db.sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`API en cours d'exécution sur le port ${port}`);
  });
}).catch(err => {
  console.error('Erreur de synchronisation de la base de données:', err);
});