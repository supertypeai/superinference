import endpoints from "../endpoints.json";
import { toString } from "nlcst-to-string";
import { retext } from "retext";
import retextPos from "retext-pos";
import retextKeywords from "retext-keywords";
import stopwords from "stopwords";

const githubLink = endpoints["github"];

const skillInference = async (
  githubHandle,
  bio,
  repos,
  token = null,
  top_language_n = 3
) => {

  // keywords list
  const keywords = await fetch('https://raw.githubusercontent.com/supertypeai/collective/staging/src/data/profileTagsChoices.json') //temporary in staging branch, for production change itto main
        .then(response => response.json());

  let labelArr = keywords.map((item) => item.label.toLowerCase());
  let valueArr = keywords.map((item) => item.value.replace(/-/g, ' ').toLowerCase());

  const keywordsList = [...new Set([...labelArr, ...valueArr])];

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
    var keyProfile = keywordsList.filter(word =>
      new RegExp(`\\b${word}\\b`, "i").test(decodeBio)
  );

  // readme
  const responseReadme = await fetch(
    `${githubLink}/repos/${githubHandle}/${githubHandle}/contents/README.md`
  );
  const dataReadme = await responseReadme.json();
  if (dataReadme) {
    decodeReadme = atob(dataReadme.content)
      .replace(
        /\\n|###|'|ð|http[s]?:\/\/\S+|[\(\[].*?[\)\]]|<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/g,
        ""
      )
      .toLowerCase();
  }

  keyProfile = [...new Set(keyProfile.concat(keywordsList.filter(word =>
      new RegExp(`\\b${word}\\b`, "i").test(decodeContent)
  )))]

  //console log value and label

  const commonValues = valueArr.filter(value => matchedWords.includes(value)).map(word => word.replace(/\s/g, '-').replace('/', '-'));

  const capitalizeMatchedWords = matchedWords.map(word => word.split(' ').map(subWord => subWord.charAt(0).toUpperCase() + subWord.slice(1)).join(' '));
    
  const valueList = capitalizeMatchedWords.map(str => {
      const dict = keywords.find(d => d.label === str);
      return dict ? dict.value : null;
  }).filter(item => item !== null);

  const valueKeywordsList = [...new Set([...commonValues, ...valueList])];

  // languages
  let sortedLanguagesCount, languagesPercentage;
  if (token) {
    const dataLanguages = repos.map((r) =>
      fetch(`${r.languages_url}${r.private ? "?type=private" : ""}`, {
        method: "GET",
        headers: {
          Authorization: `token ${token}`,
        },
      }).then((data) => data.json())
    );

    const languages = await Promise.all(dataLanguages);

    const languagesCount = languages.reduce((result, l) => {
      Object.keys(l).forEach((key) => {
        result[key] = (result[key] || 0) + 1;
      });
      return result;
    }, {});

    sortedLanguagesCount = Object.fromEntries(
      Object.entries(languagesCount).sort(([, a], [, b]) => b - a)
    );

    languagesPercentage = Object.keys(sortedLanguagesCount).reduce(
      (result, key) => {
        result[key] = (sortedLanguagesCount[key] / repos.length).toFixed(3);
        return result;
      },
      {}
    );
  } else {
    const languagesCount = repos.reduce((result, r) => {
      if (r.language) {
        result[r.language] = (r.language || 0) + 1;
      }
      return result;
    }, {});

    sortedLanguagesCount = Object.fromEntries(
      Object.entries(languagesCount).sort(([, a], [, b]) => b - a)
    );
  }

  const topNLanguages = Object.keys(sortedLanguagesCount).slice(
    0,
    top_language_n
  );

  return {
    key_qualifications: keyProfile,
    value_keywords: valueKeywordsList,
    top_n_languages: topNLanguages,
    languages_percentage: languagesPercentage
      ? languagesPercentage
      : "only available for authorized request",
  };
};

export default skillInference;
