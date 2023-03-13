import endpoints from "../endpoints.json";

const githubLink = endpoints["github"];

const headerLinkParser = (header) => {
  const parts = header.split(",");
  const links = {};

  parts.forEach((p) => {
    const section = p.split(";");
    if (section.length != 2) {
      throw new Error("section could not be split on ';'");
    }
    const url = section[0].replace(/<(.*)>/, "$1").trim();
    const name = section[1].replace(/rel="(.*)"/, "$1").trim();
    links[name] = url;
  });

  return links;
};

const repositoryInference = async (
  githubHandle,
  top_repo_n = 3,
  token = null
) => {
  let response, links;
  let repos = [];

  if (token) {
    do {
      response = await fetch(
        links && links.next
          ? links.next
          : `${githubLink}/user/repos?per_page=100`, {
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
  } else {
    do {
      response = await fetch(
        links && links.next
          ? links.next
          : `${githubLink}/users/${githubHandle}/repos?per_page=100`
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
  }

  repos.sort(
    (a, b) =>
      b.stargazers_count +
      b.forks_count -
      (a.stargazers_count + a.forks_count)
  );

  const originalRepo = repos.filter((r) => r.fork === false && r.owner.login === githubHandle);

  const forkedRepo = repos.filter((r) => r.fork === true && r.owner.login === githubHandle);

  const counts = originalRepo.reduce(
    (result, r) => {
      result.stargazers_count += r.stargazers_count;
      result.forks_count += r.forks_count;
      return result;
    },
    { stargazers_count: 0, forks_count: 0 }
  );

  const popularRepo = originalRepo.slice(0, top_repo_n).map((r) => {
    const { name, html_url, description, stargazers_count, forks_count } = r;
    return { name, html_url, description, stargazers_count, forks_count };
  });

  const data = {
    original_repo_count: originalRepo.length,
    forked_repo_count: forkedRepo.length,
    ...counts,
    top_repo_stars_forks: popularRepo,
  };

  return data;
};

export default repositoryInference;
