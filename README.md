[![Supertype](https://img.shields.io/badge/supertype.ai-incubate-b1976b)](https://supertype.ai/incubate) &nbsp; &nbsp; ![npm](https://img.shields.io/npm/v/superinference) &nbsp; &nbsp; ![github | superinference](https://img.shields.io/github/package-json/v/supertypeai/superinference) &nbsp; &nbsp; ![license](https://img.shields.io/npm/l/superinference) 

## Superinference

Superinference is a library that infers analysis-ready attributes from a person's social media username or unique identifier and returns them as JSON objects.

It supports both token-based (OAuth) authorization for authenticated requests and unauthenticated requests for public data. It currently supports the following social media channels:

- [x] GitHub
- [x] Dev.to
- [ ] LinkedIn
- [ ] Medium
- [ ] WordPress


It is currently actively being developed so more supported social media channels will be added in the future.

### Use Cases

You might use superinference to generate profile pages of your app users, or to enrich your user data with additional information by inferring them from their social media accounts. You might also use it to accelerate your account creation process by directly inferring attributes such as their email address, name, and profile picture.

## Installation
You can install the package using `yarn` or `npm`:
    
```bash 
yarn add superinference
# or:
npm install superinference
```
This will install `superinference` from npm and add it to your `package.json` file.

## Usage

### Common Patterns

There is nothing magic here. Superinference is just a wrapper around the social media APIs and so it's usage is very simple. Here is how you would extract and infer attributes from a person using he/her GitHub and Dev.to usernames:

```js
import { inferFromDevto, inferFromGithub } from "superinference";


const { profile, stats } = inferFromGithub({ githubHandle:"onlyphantom" }).then((data) => {
    // do something with the data, such as setting states or updating UI
  return data
});
    
const bio = inferFromDevto({ devtoHandle:"onlyphantom" }).then((data) => {
    return data
})
```

Here is the sample result for each of `profile`, `stats` and `bio` created from the two function calls above:

```js
// profile
{
    "login": "onlyphantom",
    "name": "Samuel Chan",
    "avatar_url": "https://avatars.githubusercontent.com/u/16984453?v=4",
    "bio": "Work: @teamalgoritma, @supertypeai Subscribe for content: https://www.youtube.com/c/samuelchan",
    "followers": 432,
    "following": 26
}

// stats
{
    "original_repo_count": 26,
    "forked_repo_count": 4,
    "stargazers_count": 280,
    "forks_count": 231,
    "top_repo_stars_forks": [
        {
            "name": "cvessentials",
            "html_url": "https://github.com/onlyphantom/cvessentials",
            "description": "Tutorial Series (60 hour course): Essentials of computer vision",
            "stargazers_count": 151,
            "forks_count": 49
        },
        {
            "name": "elang",
            "html_url": "https://github.com/onlyphantom/elang",
            ...
        },
        {
            "name": "dataanalysis",
            "html_url": "https://github.com/onlyphantom/dataanalysis",
            ...
        }
    ]
}

// bio
{
    ...,
    "username": "onlyphantom",
    "name": "Samuel Chan",
    "twitter_username": "_onlyphantom",
    "github_username": "onlyphantom",
    "summary": "Co-founder of Algoritma, a data science academy; https://supertype.ai, a full-cycle data science agency;",
    "location": "Indonesia / Singapore",
    "website_url": "https://www.youtube.com/samuelchan",
    "joined_at": "Jul  3, 2019",
    "profile_image": "https://res.cloudinary.com/practicaldev/image/fetch/...
}
```

### Authenticated Requests
The calls in the code example above are unauthorized requests, so it collects data from public profiles and returns information that is available to the public. 

You can optionally pass in an OAuth token to make authenticated requests to, in the case of GitHub, also extract and infer stats from private repositories not available to the public.

```js
inferFromGithub({ githubHandle:"onlyphantom", token:oauth_token, top_repo_n:10 })
```

This returns the top 10 repositories, including private ones, using a GitHub OAuth token.
