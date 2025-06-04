module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nomApplication: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nomRessourceCloud: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    hasSousApp: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'applications',
    timestamps: false
  });

  return Application;
}; 