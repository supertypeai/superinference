/**
 * Infers data regarding the user's Github profile.
 *
 * @param {string} githubHandle - The Github handle of the user whose profile inference is being requested.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing inference of the user's profile.
 */

import request from "./utils/request";

const profileInference = async (githubHandle) => {
  // get the current user's profile data
  const profileURL = `/users/${githubHandle}`;
  const { data } = await request(profileURL);

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
  } = data;

  return {
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
};

export default profileInference;
