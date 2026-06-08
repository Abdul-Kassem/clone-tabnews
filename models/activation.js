import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import user from "models/user.js";
import authorization from "./authorization";
import { ForbiddenError, NotFoundError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 MINUTOS

async function findOneByUserId(userId) {
  const newToken = await runInsertQuery(userId);
  return newToken;
  async function runInsertQuery(userId) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = ($1)
        LIMIT
          1
      ;`,
      values: [userId],
    });

    return results.rows[0];
  }
}

async function findValidTokenById(tokenId) {
  const validToken = await runInsertQuery(tokenId);
  return validToken;

  async function runInsertQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND
          expires_at > NOW()
          AND
          used_at IS NULL
        LIMIT 
          1
      ;`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;
  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "FinTab <contato@abdulrkk.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no abdulrkk!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no abdulrkk

${webserver.origin}/cadastro/ativar/${activationToken.id}

atenciosamente,
Equipe Fintab`,
  });
}

async function markTokenAsUsed(activationTokenId) {
  const usedActivationToken = await runUpdateQuery(activationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(activationTokenId) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [activationTokenId],
    });

    return results.rows[0];
  }
}

const activation = {
  sendEmailToUser,
  create,
  findOneByUserId,
  findValidTokenById,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
