/**
 * Infers data regarding the user's Github profile.
 *
 * @param {string} githubHandle - The Github handle of the user whose profile inference is being requested.
 * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 * @returns {Promise<Object>} A Promise that resolves with an object containing inference of the user's profile.
 */

import request from "./utils/request";

const profileInference = async (githubHandle, token = null) => {
  // get the current user's profile data
  const profileURL = `/users/${githubHandle}`;
  const { data } = await request(profileURL, token);

  const {
    login,
    name,
    company,
    blog,
    location,
    email,
    hireable,
    twitter_username,
    avatar_url,
    bio,
    followers,
    following,
    created_at,
  } = data;

  const profile = {
    login,
    name,
    company,
    blog,
    location,
    email,
    hireable,
    twitter_username,
    avatar_url,
    bio,
    followers,
    following,
  };

  return { profile, created_at };
};

export default profileInference;
