/**
 * Makes multiple requests to a paginated Github API endpoint and returns the combined data.
 *
 * @param {string} url - The URL to request data from. This should be the first page of the data if the data is paginated.
 * @param {string|null} - Github access token to increase API rate limit and access private repositories. Default is null.
 * @returns {Object} Returns an object with the following keys:
 *  - dataList (Array): The combined data from all pages.
 *  - incompleteResults (boolean): Indicates if the results are incomplete due to hitting rate limits.
 *  - totalCount (number): The total count of items for search queries. Only returned for search endpoints.
 * @throws {Error} Throws an error if the request fails or the response status is not 200.
 */

import request from "./request";
import headerLinkParser from "./headerLinkParser";

const multipageRequest = async (url, token = null) => {
  let links, remainingRate, totalCount;
  let incompleteResults = false;
  let dataList = [];
  const search = url.includes("search");

  do {
    const { response, data } = await request(
      links && links.next ? links.next : url,
      token
    );

    if (search) {
      totalCount = data.total_count;
      dataList.push(...data.items);
    } else {
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
