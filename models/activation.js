import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import user from "models/user.js";

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
  const activatedUser = await user.setFeatures(userId, ["create:session"]);
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
};

export default activation;
