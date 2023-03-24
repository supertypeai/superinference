import endpoints from "../endpoints.json";
import { headerLinkParser } from "./repositoryInference";

const githubLink = endpoints["github"];

const incomingContributionInference = async (githubHandle, token) => {
  let responseRepo,
    responseContrib,
    linksRepo,
    linksContrib,
    remainingRateContrib,
    messageContrib;
  let dataRepo = [];
  let dataContrib = [];

  if (token) {
    // Get all user's non-fork repositories
    do {
      responseRepo = await fetch (
        linksRepo && linksRepo.next
          ? linksRepo.next
          : `${githubLink}/users/${githubHandle}/repos?sort=updated&direction=desc&per_page=100`,
          {
            method: "GET",
            headers: {
              Authorization: `token ${token}`
            }
          }
      );

      const data = await responseRepo.json();

      if (data.message && data.message === "Not Found") {
        throw new Error("Invalid GitHub handle inputted.");
      } else if (responseRepo.status === 403) {
        throw new Error(
          "API rate limit exceeded, please wait a few minutes before you try again."
        );
      } else {
        dataRepo = data.reduce((result, d) => {
          if (!d.fork) {
            result.push(d.contributors_url);
          }
          return result;
        }, []);
      }

      linksRepo = 
        responseRepo.headers.get("Link") &&
        headerLinkParser(responseRepo.headers.get("Link"));

      remainingRateContrib = +responseRepo.headers.get("X-Ratelimit-Remaining");
    } while (linksRepo?.next && remainingRateContrib > 0);

    // Get all contributors from each repository
    for (let url of dataRepo) {
      do {
        responseContrib = await fetch (
          linksContrib && linksContrib.next
            ? linksContrib.next
            : url,
            {
              method: "GET",
              headers: {
                Authorization: `token ${token}`
              }
            }
        );
  
        const data = await responseContrib.json();
  
        if (responseContrib.status === 403) {
          throw new Error(
            "API rate limit exceeded, please wait a few minutes before you try again."
          );
        } else {
          dataContrib.push(...data);
        }
  
        linksContrib =
          responseContrib.headers.get("Link") &&
          headerLinkParser(responseContrib.headers.get("Link"));
  
        remainingRateContrib = +responseContrib.headers.get("X-RateLimit-Remaining");
      } while (linksContrib?.next && remainingRateContrib > 0);
    } 
  } else {
    do {
      responseRepo = await fetch (
        linksRepo && linksRepo.next
          ? linksRepo.next
          : `${githubLink}/users/${githubHandle}/repos?sort=updated&direction=desc&per_page=100`
      );

      const data = await responseRepo.json();

      if (data.message && data.message === "Not Found") {
        throw new Error("Invalid GitHub handle inputted.");
      } else if (responseRepo.status === 403) {
        throw new Error(
          "API rate limit exceeded, please wait a few minutes before you try again."
        );
      } else {
        dataRepo = data.reduce((result, d) => {
          if (!d.fork) {
            result.push(d.contributors_url);
          }
          return result;
        }, []);
      }

      linksRepo = 
        responseRepo.headers.get("Link") &&
        headerLinkParser(responseRepo.headers.get("Link"));

      remainingRateContrib = +responseRepo.headers.get("X-Ratelimit-Remaining");
    } while (linksRepo?.next && remainingRateContrib > 0);

    // Get all contributors from each repository
    for (let url of dataRepo) {
      do {
        responseContrib = await fetch (
          linksContrib && linksContrib.next
            ? linksContrib.next
            : url
        );
  
        const data = await responseContrib.json();
  
        if (responseContrib.status === 403) {
          throw new Error(
            "API rate limit exceeded, please wait a few minutes before you try again."
          );
        } else {
          dataContrib.push(...data);
        }
  
        linksContrib =
          responseContrib.headers.get("Link") &&
          headerLinkParser(responseContrib.headers.get("Link"));
  
        remainingRateContrib = +responseContrib.headers.get("X-RateLimit-Remaining");
      } while (linksContrib?.next && remainingRateContrib > 0);
    } 
  }

  if (remainingRateContrib === 0 && linksContrib?.next) {
    messageContrib = `Hey there! Looks like the incoming contributions above are from the latest ${dataContrib.length} repositories since you've reached the API rate limit 😉`;
  }

  if (remainingRateContrib === 0 && linksRepo?.next) {
    messageContrib = `Hey there! We have detected ${dataRepo.length} repositories but unable to infer the contributions since you've reached the API rate limit 😉`;
  }

  let incomingContribution= dataContrib.reduce((result, d) => {
    if (d.login !== githubHandle) {
      result[d.login] = (result[d.login] || 0) + d.contributions;
    }
    return result;
  }, {});

  incomingContribution = Object.fromEntries(
    Object.entries(incomingContribution).sort(([, a], [, b]) => b - a)
  );

  return { incomingContribution, messageContrib };
};

export default incomingContributionInference;