import endpoints from "../endpoints.json";
import {toString} from 'nlcst-to-string'
import {retext} from 'retext'
import retextPos from 'retext-pos'
import retextKeywords from 'retext-keywords'
import natural from 'natural';
import stopwords from 'stopwords';

const githubLink = endpoints["github"];

const skillInference = async (
  githubHandle,
  bio,
  repos,
  token = null,
  top_language_n = 3
) => {

  //Bio data

  //Check if bio is null or not
  if (bio == null){
      var decodeBio = ""
  } else {
      var decodeBio = bio.replace(/\\n|###|'|ð|http[s]?:\/\/\S+|[\(\[].*?[\)\]]|<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/g, '').toLowerCase();
  }

  // ReadMe data
  const responseReadme = await fetch(
    `${githubLink}/repos/${githubHandle}/${githubHandle}/contents/README.md`
  );

  const dataReadme = await responseReadme.json();

  //Check if there is a readme.md
  if (dataReadme.message && dataReadme.message === "Not Found") {
      var decodeReadme = ""
  } else {
      var decodeReadme = atob(dataReadme.content).replace(/\\n|###|'|ð|http[s]?:\/\/\S+|[\(\[].*?[\)\]]|<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/g, '').toLowerCase();
  }
  
  // Extract profile

  // Extract keywords and keyphrases from readme
  const file = await retext()
        .use(retextPos) // Make sure to use `retext-pos` before `retext-keywords`.
        .use(retextKeywords)
        .process(await decodeReadme)

  const tokenizer = new natural.WordTokenizer();

  var keywordsArray = file.data.keywords.map((keyword) => {
      return toString(keyword.matches[0].node);
    }).filter(word => !stopwords.english.includes(word));

  var keyphrasesArray = file.data.keyphrases.map((phrase) => {
      return phrase.matches[0].nodes.map((d) => toString(d)).join('');
    }).filter(word => !stopwords.english.includes(word));

  // Extract keywords and keyphrases from bio and add to existing keywords and keyphrases list
  const fileBio = await retext()
    .use(retextPos) // Make sure to use `retext-pos` before `retext-keywords`.
    .use(retextKeywords)
    .process(await decodeBio)

  keywordsArray = keywordsArray.concat(fileBio.data.keywords.map((keyword) => {
      return toString(keyword.matches[0].node);
      }).filter(word => !stopwords.english.includes(word)));

  keyphrasesArray = keyphrasesArray.concat(fileBio.data.keyphrases.map((phrase) => {
      return phrase.matches[0].nodes.map((d) => toString(d)).join('');
  }).filter(word => !stopwords.english.includes(word)));

  // Combine keywords and keyphrases as 1 list
  const keyProfile = keywordsArray.concat(keyphrasesArray)

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
    top_n_languages: topNLanguages,
    languages_percentage: languagesPercentage
      ? languagesPercentage
      : "only available for authorized request",
    key_qualifications: keyProfile
  };
};

export default skillInference;
