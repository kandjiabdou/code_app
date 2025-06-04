module.exports = (sequelize, DataTypes) => {
  const Environnement = sequelize.define('Environnement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    typeEnvironnement: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['POC', 'DEV', 'REC', 'PPR', 'PRD']],
          msg: "Le type d'environnement doit être l'un des suivants : POC, DEV, REC, PPR, PRD"
        }
      }
    },
    idOuvertureEnv: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
    tableName: 'environnements',
    timestamps: false
  });

  return Environnement;
}; 