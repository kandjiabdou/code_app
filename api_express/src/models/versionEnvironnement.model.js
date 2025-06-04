module.exports = (sequelize, DataTypes) => {
  const VersionEnvironnement = sequelize.define('VersionEnvironnement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    environnementId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    numeroVersion: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    dateVersion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    typeAction: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'creation, modification'
    },
    commentaire: {
      type: DataTypes.STRING,
      allowNull: true
    },
    utilisateurCreateur: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'versions_environnement',
    timestamps: false
  });

  return VersionEnvironnement;
}; 