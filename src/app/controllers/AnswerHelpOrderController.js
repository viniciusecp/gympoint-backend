import * as Yup from 'yup';

import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';

import AnswerHelpOrderMail from '../jobs/AnswerHelpOrderMail';
import Queue from '../../lib/Queue';

class AnswerHelpOrders {
  async store(req, res) {
    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;

    const helpOrder = await HelpOrder.findByPk(id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (!helpOrder) {
      return res.status(400).json({ error: 'Help order does not exists' });
    }

    if (helpOrder.answer) {
      return res.status(400).json({ error: 'Help order are already answered' });
    }

    const { answer } = req.body;

    const { question, answer_at, student_id } = await helpOrder.update({
      answer,
      answer_at: new Date(),
    });

    await Queue.add(AnswerHelpOrderMail.key, {
      helpOrder,
      answer,
      answer_at,
    });

    return res.json({ id, question, answer, answer_at, student_id });
  }
}

export default new AnswerHelpOrders();
