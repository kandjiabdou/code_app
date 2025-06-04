module.exports = (sequelize, DataTypes) => {
  const Tier = sequelize.define('Tier', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    typeTier: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['Application', 'Présentation', 'Base de données', 'NAS']],
          msg: "Le type de tier doit être l'un des suivants : Application, Présentation, Base de données, NAS"
        }
      }
    },
    zoneSecurite: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['STD', 'SEC-INT', 'SEC-EXT', 'TEC-INT', 'TEC-EXT', 'MGMT']],
          msg: "La zone de sécurité doit être l'une des suivantes : STD, SEC-INT, SEC-EXT, TEC-INT, TEC-EXT, MGMT"
        }
      }
    },
    optionVip: {
      type: DataTypes.STRING,
      allowNull: false
    },
    composantId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'tiers',
    timestamps: false
  });

  return Tier;
}; 