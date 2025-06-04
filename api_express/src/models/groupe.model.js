module.exports = (sequelize, DataTypes) => {
  const Groupe = sequelize.define('Groupe', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    groupeServeur: {
      type: DataTypes.STRING,
      allowNull: true
    },
    groupeVip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    groupeSnat: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tierId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'groupes',
    timestamps: false
  });

  return Groupe;
}; 