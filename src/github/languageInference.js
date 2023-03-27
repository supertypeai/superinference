/**
 * Infers data regarding the user's programming languages from their Github repositories.
 *
 * @param {Object} options - The options object that can contain the following:
 * * @param {string} githubHandle - The Github handle of the user.
 * * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 * * @param {boolean} [include_private=false] - Flag to include private repositories in the statistics. Default is false.
 * * @param {Object} [originalRepo=null] - Original repository data (from `repositoryInference()`). Default is null.
 *
 * @returns {Promise<Object>} A Promise that resolves to an object containing information about the user's programming languages.
 * @property {Array} top_n_languages - The top n programming languages used in the GitHub user's owned repositories.
 * @property {Object.<string, number>} languages_percentage - Maps each programming language used across all of the user's repositories to its percentage of usage, sorted in descending order by percentage. Only available for authorized request.
 */

import request from "./utils/request";
import usernameTokenCheck from "./utils/usernameTokenCheck";
import { fetchRepo } from "./repositoryInference";

const languageInference = async ({
  githubHandle,
  token = null,
  include_private = false,
  originalRepo = null,
  top_language_n = 3,
} = {}) => {
  if (include_private) {
    usernameTokenCheck(githubHandle, token);
  }

  let repos = [];

  // get the current user's owned repositories if no originalRepo is provided
  if (!originalRepo) {
    const { originalRepo } = await fetchRepo(
      githubHandle,
      token,
      include_private
    );
    repos = originalRepo;
  } else {
    repos = originalRepo;
  }

  let sortedLanguagesCount, languagesPercentage;
  if (token) {
    // get the languages for each repositories if token is provided
    const dataLanguages = repos.map(async (r) => {
      const { data } = await request(
        `${r.languages_url}${r.private ? "?type=private" : ""}`,
        token
      );
      return data;
    });

    const languages = await Promise.all(dataLanguages);

    // count and sort the number of times each language is used
    const languagesCount = languages.reduce((result, l) => {
      Object.keys(l).forEach((key) => {
        const formattedKey = key.toLowerCase().replace(/ /g, "-");
        result[formattedKey] = (result[formattedKey] || 0) + 1;
      });
      return result;
    }, {});

    sortedLanguagesCount = Object.fromEntries(
      Object.entries(languagesCount).sort(([, a], [, b]) => b - a)
    );

    // calculate the percentage of repositories that use each language
    languagesPercentage = Object.keys(sortedLanguagesCount).reduce(
      (result, key) => {
        result[key] = (sortedLanguagesCount[key] / repos.length).toFixed(3);
        return result;
      },
      {}
    );
  } else {
    // count and sort the number of times each language becomes a top language if no token is provided
    const languagesCount = repos.reduce((result, r) => {
      const formattedLanguage = r.language?.toLowerCase().replace(/ /g, "-");
      if (formattedLanguage) {
        result[formattedLanguage] = (result[formattedLanguage] || 0) + 1;
      }
      return result;
    }, {});

    sortedLanguagesCount = Object.fromEntries(
      Object.entries(languagesCount).sort(([, a], [, b]) => b - a)
    );
  }

  // find top n languages
  const topNLanguages = Object.keys(sortedLanguagesCount).slice(
    0,
    top_language_n
  );

  return {
    top_n_languages: topNLanguages,
    languages_percentage: languagesPercentage || null,
  };
};

export default languageInference;
