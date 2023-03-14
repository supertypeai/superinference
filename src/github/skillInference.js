import endpoints from "../endpoints.json";

const githubLink = endpoints["github"];

const skillInference = async (
  githubHandle,
  bio,
  repos,
  token = null,
  top_language_n = 3
) => {
  const responseReadme = await fetch(
    `${githubLink}/repos/${githubHandle}/${githubHandle}/contents/README.md`
  );
  const dataReadme = await responseReadme.json();
  const decodeReadme = atob(dataReadme.content);

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
  };
};

export default skillInference;
