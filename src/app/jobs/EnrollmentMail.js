import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import CurrencyFormatter from 'currency-formatter';

import Mail from '../../lib/Mail';

class EnrollmentMail {
  get key() {
    return 'EnrollmentMail';
  }

  async handle({ data }) {
    const { student, start_date, end_date, plan, price } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Matrícula realizada',
      template: 'enrollment',
      context: {
        name: student.name,
        start_date: format(parseISO(start_date), "dd 'de' MMMM 'de' yyyy", {
          locale: pt,
        }),
        end_date: format(parseISO(end_date), "dd 'de' MMMM 'de' yyyy", {
          locale: pt,
        }),
        plan: plan.title,
        price: CurrencyFormatter.format(price, { locale: 'pt-BR' }),
      },
    });
  }
}

export default new EnrollmentMail();
