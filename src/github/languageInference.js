import endpoints from "../endpoints.json";
import { fetchRepo } from "./repositoryInference";

const githubLink = endpoints["github"];

const languageInference = async ({
  githubHandle,
  token = null,
  include_private = false,
  originalRepo = null,
} = {}) => {
  let repos = [];

  if (!originalRepo) {
    const { originalRepo } = await fetchRepo(
      githubLink,
      githubHandle,
      token,
      include_private
    );
    repos = originalRepo;
  } else {
    repos = originalRepo;
  }

  let response, sortedLanguagesCount, languagesPercentage;
  if (token) {
    const dataLanguages = repos.map(async (r) => {
      response = await fetch(
        `${r.languages_url}${r.private ? "?type=private" : ""}`,
        {
          method: "GET",
          headers: {
            Authorization: `token ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 403) {
        throw new Error(
          "API rate limit exceeded, please wait an hour before you try again."
        );
      } else {
        return data;
      }
    });

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

    return {
      languages_percentage: languagesPercentage,
    };
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

    return {
      languages_percentage:
        "Sorry, it looks like the information you're requesting is only available for authorized requests 😔",
      sortedLanguagesCount,
    };
  }
};

export default languageInference;
