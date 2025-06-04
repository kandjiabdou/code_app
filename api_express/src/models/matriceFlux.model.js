module.exports = (sequelize, DataTypes) => {
  const ZONES_VALIDES = [
    'Internet', 'Partenaires', 'Zone Publique', 'Zone Sécurisée Externe',
    'Zone Sécurisée Interne', 'Zone Sécurisée Technique', 'Zone Serveurs Non Critiques',
    'Zone Utilisateurs', 'DMZ Privée', 'LAN Serveurs', 'Zone de Management'
  ];

  const PROTOCOLES_VALIDES = [
    'TCP', 'UDP', 'HTTP', 'HTTPS', 'CFT SFTP', 'CFT PeSIT-E', 
    'CFT PeSIT-E SSL', 'JMX', 'SQL'
  ];

  const PORTS_VALIDES = [
    '8080', '80', '3000', '443', 'SERVICE-CIFS-SLF', 'SERVICE-NFS-SLF',
    'SERVICE-DB2-SLF', 'SERVICE-MySQL-SLF', 'SERVICE-ORACLE-SLF',
    'SERVICE-POSTGRES-SLF', 'SERVICE-MONGODB-SLF', 'SERVICE-MSSQL-SLF',
    '6321', '6330', '7330', '6002', 'GR-SERVICES-AD'
  ];

  const MatriceFlux = sequelize.define('MatriceFlux', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sourceZone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [ZONES_VALIDES],
          msg: "La zone source doit être une zone valide"
        }
      }
    },
    sourceDesignation: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sourceGroupe: {
      type: DataTypes.STRING,
      allowNull: false
    },
    destZone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [ZONES_VALIDES],
          msg: "La zone de destination doit être une zone valide"
        }
      }
    },
    destDesignation: {
      type: DataTypes.STRING,
      allowNull: false
    },
    destGroupe: {
      type: DataTypes.STRING,
      allowNull: false
    },
    protocole: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [PROTOCOLES_VALIDES],
          msg: "Le protocole doit être un protocole valide"
        }
      }
    },
    port: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [PORTS_VALIDES],
          msg: "Le port doit être un port valide"
        }
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['Autoriser', 'Modifier', 'Fermer']],
          msg: "L'action doit être l'une des suivantes : Autoriser, Modifier, Fermer"
        }
      }
    },
    environnementId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'matrice_flux',
    timestamps: false
  });

  return MatriceFlux;
}; 