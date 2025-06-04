module.exports = (sequelize, DataTypes) => {
  const GroupeConsommateur = sequelize.define('GroupeConsommateur', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nomGroupeConsommateur: {
      type: DataTypes.STRING,
      allowNull: false
    },
    affectationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'groupe_consommateurs',
    timestamps: false
  });

  return GroupeConsommateur;
}; 