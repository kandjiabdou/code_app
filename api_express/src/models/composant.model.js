module.exports = (sequelize, DataTypes) => {
  const Composant = sequelize.define('Composant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    environnementId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    typeComposantTiers: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['1-tier', '2-tier', '3-tier']],
          msg: "Le type de composant tiers doit être l'un des suivants : 1-tier, 2-tier, 3-tier"
        }
      }
    },
    nomComposant: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nomNetworkGroupVra: {
      type: DataTypes.STRING,
      allowNull: false
    },
    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sousApplicationId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'composants',
    timestamps: false
  });

  return Composant;
}; 