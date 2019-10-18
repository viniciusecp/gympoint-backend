import * as Yup from 'yup';

import Plan from '../models/Plan';
import Enrollment from '../models/Enrollment';

class PlanController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number()
        .integer()
        .positive()
        .required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const planExists = await Plan.findOne({
      where: { title: req.body.title },
    });

    if (planExists) {
      return res
        .status(400)
        .json({ error: 'Plan already exists with this title' });
    }

    const { id, title, duration, price } = await Plan.create(req.body);

    return res.json({ id, title, duration, price });
  }

  async index(req, res) {
    const plans = await Plan.findAll();

    return res.json(plans);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number()
        .integer()
        .positive()
        .required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const plan = await Plan.findByPk(req.params.id);

    if (!plan) {
      return res.status(400).json({ error: 'Plan does not exists' });
    }

    const { title } = req.body;

    if (title !== plan.title) {
      const planExists = await Plan.findOne({ where: { title } });

      if (planExists) {
        return res
          .status(400)
          .json({ error: 'Plan already exists with this title' });
      }
    }

    const { id, duration, price } = await plan.update(req.body);

    return res.json({ id, title, duration, price });
  }

  async delete(req, res) {
    const { id } = req.params;

    const plan = await Plan.findByPk(id);

    if (!plan) {
      return res.status(400).json({ error: 'Plan does not exists' });
    }

    /**
     * VERIFICAR SE TEM ALGUM ALUNO CADASTRADO NESSE PLANO E IMPEDIR DELETAR O PLANO CASO TENHA
     * PODENDO BUSCAR OS ALUNOS ASSOCIADOS A ESTE PLANO NA BUSCA DE CIMA E VER SE VEM ALGUM
     */
    const enrollmentInPlan = await Enrollment.findOne({
      where: { plan_id: id },
    });

    if (enrollmentInPlan) {
      return res
        .status(400)
        .json({ error: 'There are enrollments in this plan' });
    }

    await plan.destroy();

    return res.json();
  }
}

export default new PlanController();
