import Sequelize, { Model } from 'sequelize';

class Student extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        age: Sequelize.INTEGER,
        height: Sequelize.FLOAT,
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    // belongsTo -> Endereço pertence a um usuário. FK fica na tablea que estamos adicionando o relacionamento.
    // hasOne -> Usuário possui um endereço. FK fica na tabela relacionada, ou seja, na tabela de endereço.
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

export default Student;
