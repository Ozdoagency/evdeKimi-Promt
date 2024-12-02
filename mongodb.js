import { MongoClient, ServerApiVersion } from 'mongodb';
import winston from 'winston';

// Настройка логирования
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'mongodb.log' }),
  ],
});

// MongoDB URI
const uri = "mongodb+srv://ozdoagency:vLTcF7yuVFC4GHAg@cluster0.bqjyu.mongodb.net/?retryWrites=true&w=majority&tls=true";

// Создание клиента MongoDB
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Подключение к базе данных
let db;

export function connectToMongoDB() {
  // ...реализация функции connectToMongoDB...
}

export const getDb = () => {
  if (!db) {
    throw new Error("База данных не подключена. Вызовите connectToMongoDB() сначала.");
  }
  return db;
};
