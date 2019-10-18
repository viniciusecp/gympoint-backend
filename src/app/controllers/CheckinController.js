import { subDays } from 'date-fns';
import { Op } from 'sequelize';

import Checkin from '../models/Checkin';
import Enrollment from '../models/Enrollment';
import Student from '../models/Student';

class CheckinController {
  async index(req, res) {
    const { id: student_id } = req.params;
    const { page = 1 } = req.query;

    const checkins = await Checkin.findAll({
      where: { student_id },
      attributes: ['id', 'createdAt', 'student_id'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email', 'age', 'weight', 'height'],
        },
      ],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(checkins);
  }

  async store(req, res) {
    const { id: student_id } = req.params;

    const enrollmentExists = await Enrollment.findOne({
      where: {
        student_id,
        canceled_at: null,
      },
    });

    if (!enrollmentExists) {
      return res
        .status(400)
        .json({ error: 'Student does not have active enrollment' });
    }

    const checkins = await Checkin.findAll({
      where: {
        student_id,
        created_at: {
          [Op.between]: [subDays(new Date(), 7), new Date()],
        },
      },
      limit: 5,
    });

    if (checkins.length === 5) {
      return res.status(401).json({ error: 'Denied' });
    }

    const { id, createdAt } = await Checkin.create({
      student_id,
    });

    return res.json({ id, student_id, createdAt });
  }
}

export default new CheckinController();
