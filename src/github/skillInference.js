/**
 * Infer data regarding the user's skills from their Github bio, README, and repositories.
 *
 * @param {string} githubHandle - The Github handle of the user.
 * @param {string} bio - The user's Github bio
 * @param {object} originalRepos - Original repository data (from `repositoryInference()`)
 * @param {number} top_language_n - Number of top languages to be included in the inference. Default is 3.
 * @param {boolean} include_private - Flag to include private repositories in the statistics. Default is false.
 * @returns {Promise<object>} A Promise that resolves with an object containing the inferred data regarding the user's skills.
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
  const decodedReadme = data.content
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

  // find keywords from values and labels, and capitalize keywords from labels
  const keywordsFromValues = keywords
    .filter((item) => profileKeywords.includes(item.value))
    .map((item) => item.value.replace(/\s/g, "-").replace("/", "-"));
  const keywordsFromLabels = profileKeywords
    .map((word) => {
      const dict = keywords.find((item) => item.label === word);
      return dict ? dict.value : null;
    })
    .filter((item) => item !== null)
    .map((word) =>
      word
        .split(" ")
        .map((subWord) => subWord.charAt(0).toUpperCase() + subWord.slice(1))
        .join(" ")
    );

  // create list of key qualifications
  const keyQualifications = [
    ...new Set([...keywordsFromValues, ...keywordsFromLabels]),
  ];

  // calculate languages percentage and find top n languages
  let languagesPercentage, topNLanguages;
  if (token) {
    const { languages_percentage } = await languageInference({
      githubHandle: githubHandle,
      token: token,
      include_private: include_private,
      originalRepo: originalRepo,
    });

    languagesPercentage = languages_percentage;
    topNLanguages = Object.keys(languagesPercentage).slice(0, top_language_n);
  } else {
    const { sortedLanguagesCount } = await languageInference({
      githubHandle: githubHandle,
      token: token,
      include_private: include_private,
      originalRepo: originalRepo,
    });

    topNLanguages = Object.keys(sortedLanguagesCount).slice(0, top_language_n);
  }

  return {
    inference_from_originalrepo_count: originalRepo.length,
    key_qualifications: keyQualifications,
    top_n_languages: topNLanguages,
    languages_percentage:
      languagesPercentage ||
      "Sorry, it looks like the information you're requesting is only available for authorized requests 😔",
  };
};

export default skillInference;
