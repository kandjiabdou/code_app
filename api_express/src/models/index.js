const { Sequelize } = require('sequelize');
const config = require('../config/config.js');


const sequelize = new Sequelize({
  database: config.database,
  username: config.username,
  password: config.password,
  host: config.host,
  port: config.port,
  dialect: 'mysql',
  logging: false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import des modèles
db.Application = require('./application.model.js')(sequelize, Sequelize);
db.SousApplication = require('./sousApplication.model.js')(sequelize, Sequelize);
db.Environnement = require('./environnement.model.js')(sequelize, Sequelize);
db.VersionEnvironnement = require('./versionEnvironnement.model.js')(sequelize, Sequelize);
db.Demande = require('./demande.model.js')(sequelize, Sequelize);
db.Modification = require('./modification.model.js')(sequelize, Sequelize);
db.Composant = require('./composant.model.js')(sequelize, Sequelize);
db.Tier = require('./tier.model.js')(sequelize, Sequelize);
db.Groupe = require('./groupe.model.js')(sequelize, Sequelize);
db.MatriceFlux = require('./matriceFlux.model.js')(sequelize, Sequelize);
db.AffectationGroupe = require('./affectationGroupe.model.js')(sequelize, Sequelize);
db.GroupeConsommateur = require('./groupeConsommateur.model.js')(sequelize, Sequelize);

// Définition des associations
db.Application.hasMany(db.SousApplication, { foreignKey: 'applicationId' });
db.SousApplication.belongsTo(db.Application, { foreignKey: 'applicationId' });

db.Application.hasMany(db.Environnement, { foreignKey: 'applicationId' });
db.Environnement.belongsTo(db.Application, { foreignKey: 'applicationId' });

db.SousApplication.hasMany(db.Environnement, { foreignKey: 'sousApplicationId' });
db.Environnement.belongsTo(db.SousApplication, { foreignKey: 'sousApplicationId' });

db.Environnement.hasMany(db.VersionEnvironnement, { foreignKey: 'environnementId' });
db.VersionEnvironnement.belongsTo(db.Environnement, { foreignKey: 'environnementId' });

db.Environnement.hasMany(db.Demande, { foreignKey: 'environnementId' });
db.Demande.belongsTo(db.Environnement, { foreignKey: 'environnementId' });

// Association entre Demande et VersionEnvironnement
db.VersionEnvironnement.hasMany(db.Demande, { foreignKey: 'versionEnvId' });
db.Demande.belongsTo(db.VersionEnvironnement, { foreignKey: 'versionEnvId' });

db.VersionEnvironnement.hasMany(db.Modification, { foreignKey: 'versionEnvId' });
db.Modification.belongsTo(db.VersionEnvironnement, { foreignKey: 'versionEnvId' });

db.Environnement.hasMany(db.Composant, { foreignKey: 'environnementId' });
db.Composant.belongsTo(db.Environnement, { foreignKey: 'environnementId' });

db.Composant.hasMany(db.Tier, { foreignKey: 'composantId' });
db.Tier.belongsTo(db.Composant, { foreignKey: 'composantId' });

db.Tier.hasMany(db.Groupe, { foreignKey: 'tierId' });
db.Groupe.belongsTo(db.Tier, { foreignKey: 'tierId' });

db.Environnement.hasMany(db.MatriceFlux, { foreignKey: 'environnementId' });
db.MatriceFlux.belongsTo(db.Environnement, { foreignKey: 'environnementId' });

db.Environnement.hasMany(db.AffectationGroupe, { foreignKey: 'environnementId' });
db.AffectationGroupe.belongsTo(db.Environnement, { foreignKey: 'environnementId' });

db.AffectationGroupe.hasMany(db.GroupeConsommateur, { foreignKey: 'affectationId' });
db.GroupeConsommateur.belongsTo(db.AffectationGroupe, { foreignKey: 'affectationId' });

module.exports = db; 