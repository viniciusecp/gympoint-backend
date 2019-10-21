import * as Yup from 'yup';
import HelpOrder from '../models/HelpOrder';
import Enrollment from '../models/Enrollment';

class HelpOrderController {
  async index(req, res) {
    const { id: student_id } = req.params;
    const { page = 1 } = req.query;

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

    const helpOrders = await HelpOrder.findAll({
      where: { student_id },
      attributes: ['id', 'question', 'answer', 'answer_at'],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(helpOrders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

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

    const { question } = req.body;

    const helpOrderExists = await HelpOrder.findOne({
      where: { question },
    });

    if (helpOrderExists) {
      return res
        .status(400)
        .json({ error: 'Help order already exists with this question' });
    }

    const { id } = await HelpOrder.create({
      question,
      student_id,
    });

    return res.json({ id, question, student_id });
  }
}

export default new HelpOrderController();
