import * as Yup from 'yup';
import { startOfDay, addMonths, isBefore, parseISO } from 'date-fns';

import Student from '../models/Student';
import Plan from '../models/Plan';
import Enrollment from '../models/Enrollment';
import User from '../models/User';

import EnrollmentMail from '../jobs/EnrollmentMail';
import Queue from '../../lib/Queue';

class EnrollmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const enrollments = await Enrollment.findAll({
      attributes: [
        'id',
        'start_date',
        'end_date',
        'price',
        'student_id',
        'plan_id',
        'canceled_at',
        'active',
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
      limit: 20,
      offset: (page - 1) * 20,
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

    const student = await Student.findByPk(student_id);

    if (!student) {
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
      where: { student_id, canceled_at: null },
    });

    if (studentEnrollment) {
      return res.status(400).json({ error: 'Student is already enrolled' });
    }

    /**
     * Calculate end date and price
     */
    const endDate = addMonths(parsedStartDate, plan.duration);

    const price = plan.duration * plan.price;

    const { id } = await Enrollment.create({
      ...req.body,
      end_date: endDate,
      price,
    });

    await Queue.add(EnrollmentMail.key, {
      student,
      start_date: parsedStartDate,
      end_date: endDate,
      plan,
      price,
    });

    return res.json({
      id,
      student_id,
      plan_id,
      start_date,
      end_date: endDate,
      price,
    });
  }

  async update(req, res) {
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
     * Check if enrollment, student and plan exists
     */
    const { id } = req.params;
    const { student_id, plan_id, start_date } = req.body;

    const enrollment = await Enrollment.findByPk(id);

    if (!enrollment) {
      return res.status(400).json({ error: 'Enrollment does not exists' });
    }

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

    if (studentEnrollment && studentEnrollment.id !== Number(id)) {
      return res.status(400).json({ error: 'Student is already enrolled' });
    }

    /**
     * Calculate end date and price
     */
    const endDate = addMonths(parsedStartDate, plan.duration);

    const price = plan.duration * plan.price;

    await enrollment.update({
      ...req.body,
      end_date: endDate,
      price,
    });

    return res.json({
      id,
      student_id,
      plan_id,
      start_date,
      end_date: endDate,
      price,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const enrollment = await Enrollment.findByPk(id);

    if (!enrollment) {
      return res.status(400).json({ error: 'Enrolled does not exists' });
    }

    if (enrollment.canceled_at) {
      return res.status(400).json({ error: 'Enrolled is already canceled' });
    }

    enrollment.canceled_at = new Date();

    await enrollment.save();

    return res.json(enrollment);
  }
}

export default new EnrollmentController();
