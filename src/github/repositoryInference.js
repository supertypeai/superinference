import endpoints from "../endpoints.json"

const githubLink = endpoints["github"];

const repositoryInference = async (githubHandle, top_repo_n = 3, token = null) => {
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

  const repos = await response.json();

  if (repos.message && repos.message === "Not Found") {
    throw new Error("Invalid GitHub handle inputted");
  } else {
    repos.sort(
      (a, b) =>
        b.stargazers_count +
        b.forks_count -
        (a.stargazers_count + a.forks_count)
    );

    const originalRepo = repos.filter((r) => r.fork === false);

    const forkedRepo = repos.filter((r) => r.fork === true);

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
  }
};

export default repositoryInference;
