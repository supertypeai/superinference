/**
 * Parses a HTTP Link header and returns an object with key-value pairs for each link.
 *
 * @param {string} header - The Link header string to be parsed.
 * @returns {object} An object containing key-value pairs for each link.
 * @throws {Error} If a section in the Link header cannot be split on ';'.
 */

const headerLinkParser = (header) => {
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

export default headerLinkParser;
