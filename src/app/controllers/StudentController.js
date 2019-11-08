import * as Yup from 'yup';
import { Op } from 'sequelize';

import Student from '../models/Student';

class StudentController {
  async index(req, res) {
    const { q = '', page = 1 } = req.query;

    const students = await Student.findAll({
      where: { name: { [Op.iLike]: `%${q}%` } },
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(students);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      age: Yup.number()
        .required()
        .integer()
        .positive(),
      height: Yup.number()
        .required()
        .positive(),
      weight: Yup.number()
        .required()
        .positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const studentExists = await Student.findOne({
      where: { email: req.body.email },
    });

    if (studentExists) {
      return res.status(400).json({ error: 'Student already exists.' });
    }

    const { userId: user_id } = req;

    const { id, name, email, age, height, weight } = await Student.create({
      ...req.body,
      user_id,
    });

    return res.json({ id, name, email, age, height, weight, user_id });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      age: Yup.number()
        .required()
        .integer()
        .positive(),
      height: Yup.number()
        .required()
        .positive(),
      weight: Yup.number()
        .required()
        .positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;
    const { email } = req.body;

    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(400).json({ error: 'Student does not exists.' });
    }

    if (email !== student.email) {
      const emailExists = await Student.findOne({ where: { email } });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already exists.' });
      }
    }

    const { name, age, height, weight, user_id } = await student.update(
      req.body
    );

    return res.json({
      id,
      name,
      email,
      age,
      height,
      weight,
      user_id,
    });
  }
}

export default new StudentController();
