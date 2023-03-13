import endpoints from "../endpoints.json"

const githubLink = endpoints["github"];

const profileInference = async (githubHandle) => {
  const response = await fetch(`${githubLink}/users/${githubHandle}`);
  const data = await response.json();
  console.log("data from response", response)

  if (data.message && data.message === "Not Found") {
    throw new Error("Invalid GitHub handle inputted");
  } else {
    const { login, name, company, blog, location, email, hireable, twitter_username, avatar_url, bio, followers, following } = data;
    return login, name, company, blog, location, email, hireable, twitter_username, avatar_url, bio, followers, following
  }
};

export default profileInference;
