import nodemailer from "nodemailer";
import { servicesError } from "./errors.js";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production" ? true : false,
});

async function send(mailOpstions) {
  try {
    await transporter.sendMail(mailOpstions);
  } catch (error) {
    throw new servicesError({
      message: "Não foi possível enviar o email.",
      action: "Verifique se o serviço de email está disponível.",
      cause: error,
      context: mailOpstions,
    });
  }
}

const email = {
  send,
};

export default email;
