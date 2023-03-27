/**
 * Makes multiple requests to a paginated Github API endpoint and returns the combined data.
 *
 * @param {string} url - The URL to request data from. This should be the first page of the data if the data is paginated.
 * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing information about the requested data.
 * @property {Array} dataList - The combined data from all pages.
 * @property {boolean} incompleteResults - Indicates if the results are incomplete due to hitting rate limits.
 * @property {number} totalCount - The total count of items for search queries. Only returned for search endpoints.
 *
 * @throws {Error} Throws an error if the request fails or the response status is not 200.
 */

import request from "./request";
import headerLinkParser from "./headerLinkParser";

const multipageRequest = async (url, token = null) => {
  let links, remainingRate, totalCount;
  let incompleteResults = false;
  let dataList = [];
  const search = /\bsearch\b/.test(url);

  do {
    const { response, data } = await request(
      links && links.next ? links.next : url,
      token
    );

    if (search && data?.items) {
      totalCount = data.total_count;
      dataList.push(...data.items);
    } else if (data) {
      dataList.push(...data);
    }

    links =
      response.headers.get("Link") &&
      headerLinkParser(response.headers.get("Link"));

    remainingRate = +response.headers.get("X-Ratelimit-Remaining");
  } while (links?.next && remainingRate > 0);

  if (remainingRate === 0 && links?.next) {
    incompleteResults = true;
  }

  if (search) {
    return { dataList, incompleteResults, totalCount };
  } else {
    return { dataList, incompleteResults };
  }
};

export default multipageRequest;
