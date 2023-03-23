
import endpoints from "../endpoints.json";

const githubLink = endpoints["github"];

const languageInference = async (
    token = null,
    top_language_n = 3
  ) => {
    let response, links, sortedLanguagesCount, languagesPercentage;
    let repos = [];
  
    if (token) {
      do {
        response = await fetch(
          links && links.next
            ? links.next
            : `${githubLink}/user/repos?per_page=100`,
          {
            method: "GET",
            headers: {
              Authorization: `token ${token}`,
            },
          }
        );
  
        const data = await response.json();
  
        if (data.message && data.message === "Not Found") {
          throw new Error("Invalid GitHub handle inputted");
        } else {
          repos.push(...data);
        }
  
        links =
          response.headers.get("Link") &&
          headerLinkParser(response.headers.get("Link"));
      } while (links?.next);

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

    // const topNLanguages = Object.keys(sortedLanguagesCount).slice(
    //     0,
    //     top_language_n
    //   );

    }
    const topNLanguages = Object.keys(sortedLanguagesCount).slice(
        0,
        top_language_n
    )

    return {
        top_n_languages: topNLanguages,
        languages_percentage: languagesPercentage
          ? languagesPercentage
          : "Sorry, it looks like the information you're requesting is only available for authorized requests 😔",
      };

  }

export default languageInference;