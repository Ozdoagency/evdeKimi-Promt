import { sendToGemini } from './index.js'; // Импорт функции sendToGemini

// Генерация случайной задержки для эффекта "печатания" (от 3 до 6 секунд)
export const getThinkingDelay = () => {
  return Math.floor(Math.random() * (6000 - 3000 + 1)) + 3000; // Увеличена задержка перед "печатанием"
};

// Генерация времени "печатания" на основе длины текста (до 20 секунд максимум)
export const calculateTypingTime = (text) => {
  const words = text.split(' ').length;
  const baseTime = 3; // Базовое время в секундах
  return Math.min(baseTime + words * 0.7, 20) * 1000; // Скорость: 0.7 сек/слово, максимум 20 сек
};

// utils.js

export function someUtilityFunction() {
  // ...реализация утилиты...
}

export function generatePrompt(userMessage, chatId) {
  const userHistory = userHistories[chatId] || [];
  const context = userHistory.map(entry => `User: ${entry.response}\nAI: ${entry.reply}`).join('\n');
  return `${basePrompt}\n${context}\nUser: ${userMessage}\nAI:`;
}

export async function getNextQuestionWithEmotion(stage, userMessage, chatId) {
  const prompt = generatePrompt(userMessage, chatId);
  const aiResponse = await sendToGemini(prompt, chatId);

  const randomText = Array.isArray(stage.text) ? stage.text[Math.floor(Math.random() * stage.text.length)] : stage.text;
  return `${aiResponse} ${randomText}`;
}