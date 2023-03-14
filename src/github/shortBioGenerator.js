import endpoints from "../endpoints.json";

const githubLink = endpoints["github"];

const shortBioGenerator = async (
  githubHandle,
  token,
  bio,
  repos,
  top_language_n
) => {
  const responseReadme = await fetch(
    `${githubLink}/repos/${githubHandle}/${githubHandle}/contents/README.md`
  );
  const dataReadme = await responseReadme.json();
  const decodeReadme = atob(dataReadme.content);

  if (token) {
    const dataLanguages = repos.map((r) => {
      return fetch(`${r.languages_url}${r.private ? "?type=private" : ""}`, {
        method: "GET",
        headers: {
          Authorization: `token ${token}`,
        },
      }).then((data) => data.json());
    });

    const languages = await Promise.all(dataLanguages);

    const languagesCount = languages.reduce((result, l) => {
      Object.keys(l).forEach((key) => {
        result[key] = (result[key] || 0) + l[key];
      });
      return result;
    }, {});

    const sortedLanguagesCount = Object.fromEntries(
      Object.entries(languagesCount).sort(([, a], [, b]) => b - a)
    );

    const totalLanguagesCount = Object.values(sortedLanguagesCount).reduce(
      (result, count) => result + count,
      0
    );

    const languagesPercentage = Object.keys(sortedLanguagesCount).reduce(
      (result, key) => {
        result[key] = (sortedLanguagesCount[key] / totalLanguagesCount).toFixed(
          3
        );
        return result;
      },
      {}
    );

    const topNLanguages = Object.keys(sortedLanguagesCount).slice(
      0,
      top_language_n
    );

    return {
      languages_percentage: languagesPercentage,
      top_n_languages: topNLanguages,
    };
  }
};

export default shortBioGenerator;
