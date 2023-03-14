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

  const fileBio = await retext()
    .use(retextPos)
    .use(retextKeywords)
    .process(await decodeBio);

  let keywordsArray = fileBio.data.keywords
    .map((keyword) => toString(keyword.matches[0].node))
    .filter((word) => !stopwords.english.includes(word));

  let keyphrasesArray = fileBio.data.keyphrases
    .map((phrase) => phrase.matches[0].nodes.map((d) => toString(d)).join(""))
    .filter((word) => !stopwords.english.includes(word));

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

  const fileReadme = await retext()
    .use(retextPos)
    .use(retextKeywords)
    .process(await decodeReadme);

  keywordsArray.push(
    ...fileReadme.data.keywords
      .map((keyword) => toString(keyword.matches[0].node))
      .filter((word) => !stopwords.english.includes(word))
  );

  keyphrasesArray.push(
    ...fileReadme.data.keyphrases
      .map((phrase) => phrase.matches[0].nodes.map((d) => toString(d)).join(""))
      .filter((word) => !stopwords.english.includes(word))
  );

  // bio + readme
  const keyProfile = [...keywordsArray, ...keyphrasesArray];

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
    top_n_languages: topNLanguages,
    languages_percentage: languagesPercentage
      ? languagesPercentage
      : "only available for authorized request",
  };
};

export default skillInference;
