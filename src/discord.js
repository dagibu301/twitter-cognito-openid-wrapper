/* eslint-disable no-console */
const axios = require('axios');
const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  COGNITO_REDIRECT_URI,
  DISCORD_API_URL
  // DISCORD_LOGIN_URL
} = require('./config');

const getApiEndpoints = (apiBaseUrl = DISCORD_API_URL) => ({
  userDetails: `${apiBaseUrl}/users/@me`,
  userEmails: `${apiBaseUrl}/users/@me`,
  oauthToken: `${apiBaseUrl}/oauth2/token`,
  oauthAuthorize: `${apiBaseUrl}/oauth2/authorize`
});

const check = response => {
  if (response.data) {
    if (response.data.error) {
      throw new Error(
        `Discord API responded with a failure: ${response.data.error}, ${
          response.data.error_description
        }`
      );
    } else if (response.status === 200) {
      return response.data;
    }
  }
  throw new Error(
    `Discord API responded with a failure: ${response.status} (${
      response.statusText
    })`
  );
};

const discordGet = (url, accessToken) =>
  axios({
    method: 'GET',
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

module.exports = (apiBaseUrl, loginBaseUrl) => {
  const urls = getApiEndpoints(apiBaseUrl, loginBaseUrl || apiBaseUrl);
  return {
    getAuthorizeUrl: (client_id, scope, state, response_type) => {
      const cleanScope = scope
        .split(' ')
        .filter(i => i !== 'openid')
        .join(' ');
      return `${
        urls.oauthAuthorize
      }?client_id=${client_id}&scope=${encodeURIComponent(
        cleanScope
      )}&state=${state}&response_type=${response_type}`;
    },
    getUserDetails: accessToken =>
      discordGet(urls.userDetails, accessToken).then(check),
    getUserEmails: accessToken =>
      discordGet(urls.userEmails, accessToken).then(check),
    getToken: code => axios.post(
      urls.oauthToken,
      `client_id=${DISCORD_CLIENT_ID}&client_secret=${DISCORD_CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(COGNITO_REDIRECT_URI)}`,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    ).then(check)
  };
};
