import apiLinks from "../apiLinks.js";

const githubLink = apiLinks["github"];

const repositoryInference = async (githubHandle, token = null) => {
  let response;

  if (token) {
    response = await fetch(`${githubLink}/user/repo`, {
      method: "GET",
      headers: {
        Authorization: `token ${token}`,
      },
    });
  } else {
    response = await fetch(`${githubLink}/users/${githubHandle}/repos`);
  }

  const data = await response.json();

  if (data.message && data.message === "Not Found") {
    throw new Error("Invalid GitHub handle inputted");
  } else {
    data.sort(
      (a, b) =>
        b.stargazers_count +
        b.forks_count -
        (a.stargazers_count + a.forks_count)
    );

    const originalRepo = data.filter((r) => r.fork === false);

    const forkedRepo = data.filter((r) => r.fork === true);

    const counts = originalRepo.reduce(
      (result, r) => {
        result.stargazers_count += r.stargazers_count;
        result.forks_count += r.forks_count;
        return result;
      },
      { stargazers_count: 0, forks_count: 0 }
    );

    const popularRepo = originalRepo.slice(0, 3).map((r) => {
      const { name, html_url, description, stargazers_count, forks_count } = r;
      return { name, html_url, description, stargazers_count, forks_count };
    });

    const repo = {
      original_repo_count: originalRepo.length,
      forked_repo_count: forkedRepo.length,
      ...counts,
      top_repo_stars_forks: popularRepo,
    };

    return repo;
  }
};

export default repositoryInference;
