import { configDotenv } from 'dotenv';

configDotenv({ path: 'config.env' });

const { env } = process;

export const {
  DB_URL,
  MAILTRAP_USER,
  MAILTRAP_PASS,
  VERIFICATION_EMAIL,
  SIGN_IN_URL,
  JWT_SECRET,
  CLOUD_NAME,
  CLOUD_KEY,
  CLOUD_SECRET,
} = env;
