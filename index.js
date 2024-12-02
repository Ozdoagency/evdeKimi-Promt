// Imports
import TelegramBot from 'node-telegram-bot-api'; // Import Telegram Bot API
import express from 'express'; // Import Express
import bodyParser from 'body-parser'; // Import Body Parser
import winston from 'winston'; // Import Winston for logging
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import Google Generative AI
import dialogStages from './prompts.js'; // Import dialog stages from prompts.js
import { askNextQuestion } from './questionsHandler.js'; // Import askNextQuestion function from questionsHandler.js
import { connectToMongoDB } from './mongodb.js'; // Import connectToMongoDB function from mongodb.js
import fs from 'fs'; // Import fs module for file system operations
import path from 'path'; // Import path module for file paths
import { getThinkingDelay, calculateTypingTime } from './utils.js'; // Import utilities
import { getNextQuestionWithEmotion } from './utils.js';

// Configuration
const config = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || 'Your_Telegram_Token',
  WEBHOOK_URL: process.env.WEBHOOK_URL || 'Your_Webhook_Url',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'Your_Gemini_API_Key',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  MAX_TELEGRAM_MESSAGE_LENGTH: 4096,
  ADMIN_ID: process.env.ADMIN_ID || null,
  REQUEST_LIMIT: 5,
  REQUEST_WINDOW: 60000,
  PORT: process.env.PORT || 8443, // Changed port to 8443
  GROUP_CHAT_ID: process.env.GROUP_CHAT_ID || '-4522204925', // Ensure this is the correct group ID
  BOT_TOKEN: process.env.TELEGRAM_TOKEN || '2111920825:AAGVeO134IP43jQdU9GNQRJw0gUcJPocqaU',
};

// Initialize GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Initialize Telegram Bot
const bot = new TelegramBot(config.TELEGRAM_TOKEN, { webHook: true });
bot.setWebHook(`${config.WEBHOOK_URL}/bot${config.TELEGRAM_TOKEN}`)
  .then(() => logger.info('Webhook successfully set'))
  .catch(error => logger.error(`Error setting webhook: ${error.message}`));

// Logging with Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs.log', maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
  ],
});

// Global variables
const userHistories = {};
const userRequestTimestamps = {};
let userStages = {}; // Store the current stage for each user

// Connect to MongoDB
connectToMongoDB();

// Function to read text from a file
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function get_file_text(filename) {
  const filePath = path.join(__dirname, filename);
  return fs.readFileSync(filePath, 'utf8');
}

// Read the base prompt from a file
const basePrompt = get_file_text('BasePrompt.txt');

// Complete the qualification process
function completeQualification(chatId) {
  const message = get_file_text('Qualified, answered all questions.txt');
  bot.sendMessage(chatId, message);
  sendCollectedDataToGroup(chatId);
}

// Partial qualification
function partialQualification(chatId) {
  const message = get_file_text('Partially qualified, needs follow-up.txt');
  bot.sendMessage(chatId, message);
  sendCollectedDataToGroup(chatId);
}

// Handle client declined interaction
function clientDeclinedInteraction(chatId) {
  const message = get_file_text('Client declined further interaction.txt');
  bot.sendMessage(chatId, message);
}

// Handle company info request
function sendCompanyInfo(chatId) {
  const message = get_file_text('About Company EvdeKimi.txt');
  bot.sendMessage(chatId, message);
}

// Handle catalog request
function handleCatalogRequest(chatId) {
  const message = get_file_text('If the client requests a catalog.txt');
  bot.sendMessage(chatId, message);
}

// **Function sendToGemini**
async function sendToGemini(prompt, chatId) {
  try {
    logger.info(`Sending request to Gemini API from chatId ${chatId}: "${prompt}"`);
    const result = await model.generateContent(prompt);

    logger.info(`Full response from Gemini API for chatId ${chatId}: ${JSON.stringify(result)}`);

    if (result.response && result.response.candidates && result.response.candidates.length > 0) {
      const reply = result.response.candidates[0].content.parts[0].text || 'No response.';
      logger.info(`Response from Gemini API for chatId ${chatId}: "${reply}"`);
      return reply;
    } else {
      logger.warn(`Gemini API did not return candidates for chatId ${chatId}.`);
      return 'Sorry, I could not process your request. Gemini API did not return text.';
    }
  } catch (error) {
    logger.error(`Gemini API error for chatId ${chatId}: ${error.message}`);
    throw new Error(`An error occurred while processing the request: ${error.message}`);
  }
}

// **Delay function**
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// **Function to simulate typing messages**
async function sendTypingMessage(chatId, text) {
  if (!text || text.trim() === '') return;

  const typingDelay = getThinkingDelay(); // Use function to generate random delay
  const typingDuration = calculateTypingTime(text); // Use function to calculate typing time

  await bot.sendChatAction(chatId, 'typing');
  await delay(typingDelay);

  const MAX_LENGTH = config.MAX_TELEGRAM_MESSAGE_LENGTH;
  const messages = [];

  for (let i = 0; i < text.length; i += MAX_LENGTH) {
    messages.push(text.substring(i, i + MAX_LENGTH));
  }

  for (const message of messages) {
    await bot.sendChatAction(chatId, 'typing');
    await delay(typingDuration);
    await bot.sendMessage(chatId, message);
  }
}

// **Function to send messages using AI**
async function sendAIResponse(chatId, userMessage) {
  const prompt = generatePrompt(userMessage, chatId);
  const aiResponse = await sendToGemini(prompt, chatId);
  await sendTypingMessage(chatId, aiResponse);
}

// **Function to send messages**
async function sendMessage(chatId, text) {
  if (!text || text.trim() === '') return;

  const MAX_LENGTH = config.MAX_TELEGRAM_MESSAGE_LENGTH;
  const messages = [];

  for (let i = 0; text.length; i += MAX_LENGTH) { // Fixed loop
    messages.push(text.substring(i, i + MAX_LENGTH));
  }

  for (const message of messages) {
    await bot.sendMessage(chatId, message);
  }
}

// **Function to send collected data to group**
async function sendCollectedDataToGroup(chatId) {
  const userHistory = userHistories[chatId];
  if (!userHistory) return;

  const collectedData = userHistory.map(entry => `${entry.stage}: ${entry.response}`).join('\n');
  const message = `Collected data:\n${collectedData}`;

  try {
    const groupBot = new TelegramBot(config.BOT_TOKEN);
    await groupBot.sendMessage(config.GROUP_CHAT_ID, message);
    logger.info(`Data successfully sent to group for chatId: ${chatId}`);
  } catch (error) {
    logger.error(`Error sending data to group for chatId ${chatId}: ${error.message}`);
  }
}

// **Function to generate prompt for Gemini API**
function generatePrompt(userMessage, chatId) {
  const userHistory = userHistories[chatId] || [];
  const context = userHistory.map(entry => `User: ${entry.response}\nAI: ${entry.reply}`).join('\n');
  return `${basePrompt}\n${context}\nUser: ${userMessage}\nAI:`;
}

// **Function to handle long responses**
async function handleLongResponse(chatId, response) {
  const MAX_LENGTH = config.MAX_TELEGRAM_MESSAGE_LENGTH;
  const messages = [];

  for (let i = 0; i < response.length; i += MAX_LENGTH) { // Fixed loop
    messages.push(response.substring(i, i + MAX_LENGTH));
  }

  for (const message of messages) {
    await sendTypingMessage(chatId, message);
  }
}

// **Handle /start command**
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || '';
  logger.info(`Received /start command from chatId: ${chatId}`);

  // Initialize user data
  userStages[chatId] = {
    stage: 0,
    data: {
      goal: null,
      grade: null,
      knowledge: null,
      date: null,
      phone: null
    },
    askedPhone: false
  };
  
  userHistories[chatId] = [];
  userRequestTimestamps[chatId] = { count: 0, timestamp: Date.now() };

  // Get welcome message from dialogStages and insert name
  const welcomeStage = dialogStages.questions.find(q => q.stage === "Greeting");
  if (!welcomeStage) {
    logger.error(`Stage "Greeting" not found in dialogStages`);
    await sendTypingMessage(chatId, "Sorry, an error occurred. Please try again or start over with the /start command");
    return;
  }
  const welcomeMessage = welcomeStage.text.replace('{name}', firstName);

  logger.info(`Sending welcome message to chatId: ${chatId}`);
  await sendTypingMessage(chatId, welcomeMessage);

  // Send base prompt
  await sendTypingMessage(chatId, basePrompt);
});

// **Handle text messages**
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;
  
  try {
    // Ignore commands and empty messages
    if (!userMessage || userMessage.startsWith('/')) return;

    logger.info(`Received message from chatId: ${chatId}, text: ${userMessage}`);

    // Check and initialize user state
    if (!userStages[chatId]) {
      userStages[chatId] = {
        stage: 0,
        data: {
          goal: null,
          grade: null,
          knowledge: null,
          date: null,
          phone: null
        },
        askedPhone: false
      };
    }

    const currentStage = dialogStages.questions[userStages[chatId].stage];
    if (!currentStage) {
      logger.warn(`Invalid dialog stage for chatId ${chatId}`);
      return;
    }

    // Save user response
    userHistories[chatId] = userHistories[chatId] || [];
    userHistories[chatId].push({
      stage: currentStage.stage,
      response: userMessage,
      timestamp: Date.now()
    });

    // Handle next stage
    await askNextQuestion(chatId, userStages, bot, userMessage);

    // Generate and send AI response
    await sendAIResponse(chatId, userMessage);

    // Check qualification completion
    const userStageData = userStages[chatId].data;
    const answeredQuestions = Object.values(userStageData).filter(answer => answer !== null).length;

    if (answeredQuestions >= 3) {
      completeQualification(chatId);
    } else if (answeredQuestions < 3 && userStages[chatId].stage >= dialogStages.questions.length) {
      partialQualification(chatId);
    }
  } catch (error) {
    logger.error(`Error processing message from chatId ${chatId}: ${error.message}`);
    await sendTypingMessage(chatId, "Sorry, an error occurred. Please try again or start over with the /start command");
  }
});

// **Express server**
const app = express();
app.use(bodyParser.json());

app.post(`/bot${config.TELEGRAM_TOKEN}`, (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => {
  res.send('Server is running! 🚀');
});

app.listen(config.PORT, () => {
  logger.info(`Server started on port ${config.PORT}`);
});
