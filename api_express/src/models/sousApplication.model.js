module.exports = (sequelize, DataTypes) => {
  const SousApplication = sequelize.define('SousApplication', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nomSousApplication: {
      type: DataTypes.STRING,
      allowNull: false
    },
    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'sous_applications',
    timestamps: false
  });

  return SousApplication;
}; 