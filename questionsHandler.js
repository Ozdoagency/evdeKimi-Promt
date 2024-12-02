import { getThinkingDelay, calculateTypingTime, getNextQuestionWithEmotion } from './utils.js';
import dialogStages from './prompts.js';
import { sendTypingMessage } from './index.js'; // Импорт функции sendTypingMessage

export async function askNextQuestion(chatId, userStages, bot, userMessage) {
  const currentStage = dialogStages.questions[userStages[chatId].stage];
  if (!currentStage) {
    logger.warn(`Invalid dialog stage for chatId ${chatId}`);
    return;
  }

  // Генерация следующего вопроса
  const nextQuestion = await getNextQuestionWithEmotion(currentStage, userMessage, chatId);

  // Отправка следующего вопроса пользователю
  await sendTypingMessage(chatId, nextQuestion);

  // Обновление этапа пользователя
  userStages[chatId].stage += 1;
}