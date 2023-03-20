import endpoints from "../endpoints.json";

const githubLink = endpoints["github"];

export const headerLinkParser = (header) => {
  const parts = header.split(",");
  const links = {};

  parts.forEach((p) => {
    const section = p.split(";");
    if (section.length != 2) {
      throw new Error("Section could not be split on ';'.");
    }
    const url = section[0].replace(/<(.*)>/, "$1").trim();
    const name = section[1].replace(/rel="(.*)"/, "$1").trim();
    links[name] = url;
  });

  return links;
};

const repositoryInference = async (
  githubHandle,
  token = null,
  include_private,
  top_repo_n = 3
) => {
  let response, links, remainingRate, messageRepo;
  let repos = [];

  if (include_private) {
    if (token) {
      const responseCheck = await fetch(`${githubLink}/user`, {
        method: "GET",
        headers: {
          Authorization: `token ${token}`,
        },
      });

      const check = await responseCheck.json();

      if (check.login === githubHandle) {
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
            throw new Error("Invalid GitHub handle inputted.");
          } else if (response.status === 403) {
            throw new Error(
              "API rate limit exceeded, please wait an hour before you try again."
            );
          } else {
            repos.push(...data);
          }

          links =
            response.headers.get("Link") &&
            headerLinkParser(response.headers.get("Link"));

          remainingRate = +response.headers.get("X-Ratelimit-Remaining");
        } while (links?.next && remainingRate > 0);
      } else {
        throw new Error(
          "The token entered does not match the githubHandle you provided."
        );
      }
    } else {
      throw new Error(
        "The include_private parameter can only be used when a valid token is provided."
      );
    }
  } else {
    if (token) {
      do {
        response = await fetch(
          links && links.next
            ? links.next
            : `${githubLink}/users/${githubHandle}/repos?per_page=100`,
          {
            method: "GET",
            headers: {
              Authorization: `token ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.message && data.message === "Not Found") {
          throw new Error("Invalid GitHub handle inputted.");
        } else if (response.status === 403) {
          throw new Error(
            "API rate limit exceeded, please wait an hour before you try again."
          );
        } else {
          repos.push(...data);
        }

        links =
          response.headers.get("Link") &&
          headerLinkParser(response.headers.get("Link"));

        remainingRate = +response.headers.get("X-Ratelimit-Remaining");
      } while (links?.next && remainingRate > 0);
    } else {
      do {
        response = await fetch(
          links && links.next
            ? links.next
            : `${githubLink}/users/${githubHandle}/repos?per_page=100`
        );

        const data = await response.json();

        if (data.message && data.message === "Not Found") {
          throw new Error("Invalid GitHub handle inputted.");
        } else if (response.status === 403) {
          throw new Error(
            "API rate limit exceeded, please use an authenticated request."
          );
        } else {
          repos.push(...data);
        }

        links =
          response.headers.get("Link") &&
          headerLinkParser(response.headers.get("Link"));

        remainingRate = +response.headers.get("X-Ratelimit-Remaining");
      } while (links?.next && remainingRate > 0);
    }
  }

  if (remainingRate === 0 && links?.next) {
    messageRepo = `Hey there! Looks like the inference above is from the latest ${repos.length} repos since you've reached the API rate limit 😉`;
  }

  repos.sort(
    (a, b) =>
      b.stargazers_count + b.forks_count - (a.stargazers_count + a.forks_count)
  );

  const originalRepo = repos.filter(
    (r) => r.fork === false && r.owner.login === githubHandle
  );

  const forkedRepo = repos.filter(
    (r) => r.fork === true && r.owner.login === githubHandle
  );

  const counts = originalRepo.reduce(
    (result, r) => {
      result.stargazers_count += r.stargazers_count;
      result.forks_count += r.forks_count;
      return result;
    },
    { stargazers_count: 0, forks_count: 0 }
  );

  const popularRepo = originalRepo.slice(0, top_repo_n).map((r) => {
    const {
      name,
      html_url,
      description,
      language,
      stargazers_count,
      forks_count,
    } = r;
    return {
      name,
      html_url,
      description,
      top_language: language,
      stargazers_count,
      forks_count,
    };
  });

  const stats = {
    original_repo_count: originalRepo.length,
    forked_repo_count: forkedRepo.length,
    ...counts,
    top_repo_stars_forks: popularRepo,
  };

  return { stats, originalRepo, repos, messageRepo };
};

export default repositoryInference;
