import endpoints from "../endpoints.json";

const githubLink = endpoints["github"];

const skillInference = async (
  githubHandle,
  bio,
  originalRepo,
  messageRepo,
  token = null,
  top_language_n = 3
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
  let sortedLanguagesCount, languagesPercentage;
  if (token) {
    const dataLanguages = originalRepo.map((r) =>
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
        result[key] = (sortedLanguagesCount[key] / originalRepo.length).toFixed(
          3
        );
        return result;
      },
      {}
    );
  } else {
    const languagesCount = originalRepo.reduce((result, r) => {
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
    key_qualifications: keyQualifications,
    top_n_languages: topNLanguages,
    languages_percentage: languagesPercentage
      ? languagesPercentage
      : "Sorry, it looks like the information you're requesting is only available for authorized requests 😔",
    repo_api_message: messageRepo ? messageRepo : "",
  };
};

export default skillInference;
