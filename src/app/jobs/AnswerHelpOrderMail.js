import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class AnswerHelpOrderMail {
  get key() {
    return 'AnswerHelpOrderMail';
  }

  async handle({ data }) {
    const { helpOrder, answer, answer_at } = data;

    await Mail.sendMail({
      to: `${helpOrder.student.name} <${helpOrder.student.email}>`,
      subject: 'Pedido de auxílio atendido',
      template: 'answerHelpOrder',
      context: {
        name: helpOrder.student.name,
        question: helpOrder.question,
        answer,
        answer_at: format(
          parseISO(answer_at),
          "'dia' dd 'de' MMMM 'de' yyyy', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new AnswerHelpOrderMail();
