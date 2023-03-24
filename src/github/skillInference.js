import endpoints from "../endpoints.json";
import languageInference from "./languageInference";

const githubLink = endpoints["github"];

const skillInference = async (
  githubHandle,
  bio,
  originalRepo,
  messageRepo,
  token = null,
  top_language_n = 3,
  include_private
) => {
  // keywords list
  const keywords = await fetch(
    "https://raw.githubusercontent.com/supertypeai/collective/main/src/data/profileTagsChoices.json"
  ).then((response) => response.json());

  const labels = keywords.map((item) => item.label.toLowerCase());
  const values = keywords.map((item) =>
    item.value.replace(/-/g, " ").toLowerCase()
  );

  const keywordsList = [...new Set([...labels, ...values])];

  let decodeBio, decodeReadme;
  // bio
  if (bio) {
    decodeBio = bio
      .replace(
        /\\n|###|'|ð|http[s]?:\/\/\S+|[\(\[].*?[\)\]]|<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/g,
        ""
      )
      .toLowerCase();
  }
  let profileKeywords = keywordsList.filter((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(decodeBio)
  );

  // readme
  const responseReadme = await fetch(
    `${githubLink}/repos/${githubHandle}/${githubHandle}/contents/README.md`
  );
  const dataReadme = await responseReadme.json();
  if (dataReadme.content) {
    decodeReadme = atob(dataReadme.content)
      .replace(
        /\\n|###|'|ð|http[s]?:\/\/\S+|[\(\[].*?[\)\]]|<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/g,
        ""
      )
      .toLowerCase();
  }

  profileKeywords = [
    ...new Set(
      profileKeywords.concat(
        keywordsList.filter((word) =>
          new RegExp(`\\b${word}\\b`, "i").test(decodeReadme)
        )
      )
    ),
  ];

  const keywordsFromValues = values
    .filter((value) => profileKeywords.includes(value))
    .map((word) => word.replace(/\s/g, "-").replace("/", "-"));

  const capitalizedProfileKeywords = profileKeywords.map((word) =>
    word
      .split(" ")
      .map((subWord) => subWord.charAt(0).toUpperCase() + subWord.slice(1))
      .join(" ")
  );

  const keywordsFromLabels = capitalizedProfileKeywords
    .map((str) => {
      const dict = keywords.find((d) => d.label === str);
      return dict ? dict.value : null;
    })
    .filter((item) => item !== null);

  const keyQualifications = [
    ...new Set([...keywordsFromValues, ...keywordsFromLabels]),
  ];

  // languages
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
    key_qualifications: keyQualifications,
    top_n_languages: topNLanguages,
    languages_percentage: languagesPercentage
      ? languagesPercentage
      : "Sorry, it looks like the information you're requesting is only available for authorized requests 😔",
    repo_api_message: messageRepo ? messageRepo : "",
  };
};

export default skillInference;
