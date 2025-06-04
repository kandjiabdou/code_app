module.exports = (sequelize, DataTypes) => {
  const Demande = sequelize.define('Demande', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nomDemande: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    proprietaire: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dateCreation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    environnementId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    versionEnvId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'demandes',
    timestamps: false
  });

  return Demande;
}; 