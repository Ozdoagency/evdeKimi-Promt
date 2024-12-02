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