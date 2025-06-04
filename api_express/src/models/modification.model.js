module.exports = (sequelize, DataTypes) => {
  const Modification = sequelize.define('Modification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    versionEnvId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    typeElement: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'flux, composant, tier, groupe, affectation_groupe'
    },
    idElementCible: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    typeModification: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'ajout, modification, suppression'
    },
    champModifie: {
      type: DataTypes.STRING,
      allowNull: true
    },
    idValeurAncienne: {
      type: DataTypes.STRING,
      allowNull: true
    },
    idValeurNouvelle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    utilisateurModificateur: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dateModification: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'modifications',
    timestamps: false
  });

  return Modification;
}; 