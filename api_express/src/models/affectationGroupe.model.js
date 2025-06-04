module.exports = (sequelize, DataTypes) => {
  const AffectationGroupe = sequelize.define('AffectationGroupe', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    environnementId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    groupeService: {
      type: DataTypes.STRING,
      allowNull: false
    },
    typeAffectation: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['auto', 'saisie']],
          msg: "Le type d'affectation doit être l'un des suivants : auto, saisie"
        }
      }
    }
  }, {
    tableName: 'affectation_groupes',
    timestamps: false
  });

  return AffectationGroupe;
}; 