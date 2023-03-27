/**
 * Infer data regarding the user's skills from their Github bio, README, and repositories.
 *
 * @param {string} githubHandle - The Github handle of the user.
 * @param {string} bio - The user's Github bio.
 * @param {Object} originalRepo - Original repository data (from `repositoryInference()`).
 * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 * @param {number} [top_language_n=3] - Number of top languages to be included in the inference. Default is 3.
 * @param {boolean} [include_private=false] - Flag to include private repositories in the statistics. Default is false.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing information about the user's skills.
 * @property {number} inference_from_originalrepo_count - The number of owned repositories got from the API (before reaching the API rate limit).
 * @property {Array} key_qualifications -  The top skills that the GitHub user has based on the contents of their bio and README.
 * @property {Array} top_n_languages - The top n programming languages used in the GitHub user's owned repositories.
 * @property {Object.<string, number>} languages_percentage - Maps each programming language used across all of the user's repositories to its percentage of usage, sorted in descending order by percentage. Only available for authorized request.
 */

import languageInference from "./languageInference";
import request from "./utils/request";

const skillInference = async (
  githubHandle,
  bio,
  originalRepo,
  token = null,
  top_language_n = 3,
  include_private = false
) => {
  // fetch keywords list
  const keywordsResponse = await fetch(
    "https://raw.githubusercontent.com/supertypeai/collective/main/src/data/profileTagsChoices.json"
  );
  const keywordsData = await keywordsResponse.json();
  const keywords = keywordsData.map((item) => ({
    label: item.label.toLowerCase(),
    value: item.value.replace(/-/g, " ").toLowerCase(),
  }));

  // combine labels and values to create list of unique keywords
  const keywordsList = [
    ...new Set(keywords.flatMap((item) => [item.label, item.value])),
  ];

  // process bio and decode readme
  const decodedBio = bio
    ? bio
        .replace(
          /\\n|###|'|ð|http[s]?:\/\/\S+|[\(\[].*?[\)\]]|<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/g,
          ""
        )
        .toLowerCase()
    : "";

  const { data } = await request(
    `/repos/${githubHandle}/${githubHandle}/contents/README.md`
  );
  const decodedReadme =
    data && data.content
      ? atob(data.content)
          .replace(
            /\\n|###|'|ð|http[s]?:\/\/\S+|[\(\[].*?[\)\]]|<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/g,
            ""
          )
          .toLowerCase()
      : "";

  // find keywords in bio and readme
  const profileKeywords = keywordsList.filter((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(`${decodedBio} ${decodedReadme}`)
  );

  const capitalizedProfileKeywords = profileKeywords.map((word) =>
    word
      .split(" ")
      .map((subWord) => subWord.charAt(0).toUpperCase() + subWord.slice(1))
      .join(" ")
  );

  // find keywords from values and labels
  const keywordsFromValues = keywords
    .filter((item) => profileKeywords.includes(item.value))
    .map((item) => item.value.replace(/\s/g, "-").replace("/", "-"));
  const keywordsFromLabels = capitalizedProfileKeywords
    .map((word) => {
      const dict = keywords.find((item) => item.label === word);
      return dict ? dict.value : null;
    })
    .filter((item) => item !== null);

  // create list of key qualifications
  const keyQualifications = [
    ...new Set([...keywordsFromValues, ...keywordsFromLabels]),
  ];

  // language inference
  const languages = await languageInference({
    githubHandle,
    token,
    include_private,
    originalRepo,
    top_language_n,
  });

  return {
    inference_from_originalrepo_count: originalRepo.length,
    key_qualifications: keyQualifications,
    ...languages,
  };
};

export default skillInference;
