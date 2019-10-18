import * as Yup from 'yup';
import { startOfDay, addMonths, isBefore, parseISO } from 'date-fns';

import Student from '../models/Student';
import Plan from '../models/Plan';
import Enrollment from '../models/Enrollment';
import User from '../models/User';

class EnrollmentController {
  async index(req, res) {
    const enrollments = await Enrollment.findAll({
      attributes: [
        'id',
        'start_date',
        'end_date',
        'price',
        'student_id',
        'plan_id',
      ],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email', 'age', 'weight', 'height', 'user_id'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'email'],
            },
          ],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['title', 'duration', 'price'],
        },
      ],
    });

    return res.json(enrollments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number()
        .integer()
        .positive()
        .required(),
      plan_id: Yup.number()
        .integer()
        .positive()
        .required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    /**
     * Check if student and plan exists
     */
    const { student_id, plan_id, start_date } = req.body;

    const studentExists = await Student.findByPk(student_id);

    if (!studentExists) {
      return res.status(400).json({ error: 'Student does not exists' });
    }

    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(400).json({ error: 'Plan does not exists' });
    }

    /**
     * Check for past dates
     */
    const parsedStartDate = startOfDay(parseISO(start_date));

    if (isBefore(parsedStartDate, startOfDay(new Date()))) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    /**
     * Check if student already has an enrollment
     */
    const studentEnrollment = await Enrollment.findOne({
      where: { student_id },
    });

    if (studentEnrollment) {
      return res.status(400).json({ error: 'Student is already enrolled' });
    }

    /**
     * Calculate end date and price
     */
    const endDate = addMonths(parsedStartDate, plan.duration);

    const price = plan.duration * plan.price;

    const { id, end_date } = await Enrollment.create({
      ...req.body,
      end_date: endDate,
      price,
    });

    /**
     * ENVIAR EMAIL!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
     */

    return res.json({ id, student_id, plan_id, start_date, end_date, price });
  }
}

export default new EnrollmentController();
