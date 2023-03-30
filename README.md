[![Supertype](https://img.shields.io/badge/supertype.ai-incubate-b1976b)](https://supertype.ai/incubate) &nbsp; &nbsp; ![npm](https://img.shields.io/npm/v/superinference) &nbsp; &nbsp; ![github | superinference](https://img.shields.io/github/package-json/v/supertypeai/superinference) &nbsp; &nbsp; ![license](https://img.shields.io/npm/l/superinference) 

## Superinference

Superinference is a library that infers analysis-ready attributes from a person's social media username or unique identifier and returns them as JSON objects.

It supports both token-based (OAuth) authorization for authenticated requests and unauthenticated requests for public data. It currently supports the following social media channels:

- [x] GitHub
- [x] Dev.to
- [ ] LinkedIn
- [ ] Medium
- [ ] WordPress

### Live Demo:
Use [this codesandbox](https://bit.ly/superinference) to quickly experiment with Superinference. A [python library of Superinference](https://github.com/supertypeai/superinference-py) is also available and maintained by [tmtsmrsl](https://github.com/tmtsmrsl).

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

// using then
let profile, skill, stats, activity, contribution, bio;
inferFromGithub({ githubHandle:"AurelliaChristie" }).then((data) => {
    // do something with the data, such as setting states or updating UI
    ({ profile, skill, stats, activity, contribution, bio } = data);
});
    
inferFromDevto({ devtoHandle:"onlyphantom" }).then((data) => {
    ({ bio } = data);
})

// using await 
const { profile, skill, stats, activity, contribution } = await inferFromGithub({ githubHandle:"AurelliaChristie" });
    
const bio = await inferFromDevto({ devtoHandle:"onlyphantom" });
```

Here is the sample result for each of `profile`, `skill`, `stats`, `activity`, `contribution`, and `bio` created from the two function calls above:

```js
// profile
{
    "login": "AurelliaChristie",
    "name": "Aurellia Christie",
    "company": "@supertypeai ",
    "blog": "",
    "location": null,
    "email": null,
    "hireable": null,
    "twitter_username": null,
    "avatar_url": "https://avatars.githubusercontent.com/u/69672839?v=4",
    "bio": "Full Stack Data Scientist at @supertypeai",
    "followers": 8,
    "following": 8
}

// skill (based on the user's owned repositories data)
{
    "inference_from_originalrepo_count": 17,
    "key_qualifications": [ "consultancy", "full-stack-developer" ],
    "top_n_languages": [ "html", "javascript", "python" ],
    "languages_percentage": { 
        // only available for authorized request
        // otherwise will return null
        "html": "0.500",
        "javascript": "0.333",
        "python": "0.278",
        "css": "0.222",
        "r": "0.111",
        "jupyter-notebook": "0.056"
    }
}

// stats (repositories)
{
    "incomplete_repo_results": false,
    "inference_from_repo_count": 26,
    "original_repo_count": 18,
    "forked_repo_count": 9,
    "stargazers_count": 2,
    "forks_count": 5,
    "top_repo_stars_forks": [
        {
          "name": "Ad-Fatigued-List-Generator",
          "html_url": "https://github.com/AurelliaChristie/Ad-Fatigued-List-Generator",
          "description": null,
          "top_language": "Python",
          "stargazers_count": 0,
          "forks_count": 1
        },
        {
          "name": "BeautIndonesia",
          "html_url": "https://github.com/AurelliaChristie/BeautIndonesia",
          ...
        },
        {
          "name": "cryptocurrency",
          "html_url": "https://github.com/AurelliaChristie/cryptocurrency",
          ...
        }
    ]
}

// activity (commits)
{
    "commit_count": 433,
    "incomplete_commit_results": false,
    "inference_from_commit_count": 433,
    "weekly_average_commits": "3.639",
    "commit_count_per_day": {
        "Wed": [ 48, 81 ], // the first value represents the commit counts in the last 12 months, while the second value represents the commit counts of all time
        "Thu": [ 41, 87 ],
        "Mon": [ 29, 57 ],
        "Fri": [ 26, 80 ],
        "Tue": [ 26, 70 ],
        "Sat": [ 2, 22 ],
        "Sun": [ 0, 36 ]
    },
    "commit_count_per_month": {
        "Mar": [ 62, 63 ], // the first value represents the commit counts in the last 12 months, while the second value represents the commit counts of all time
        "Feb": [ 33, 33 ],
        "Jun": [ 23, 23 ],
        "Aug": [ 15, 19 ],
        "Jul": [ 14, 29 ],
        "Oct": [ 12, 122 ],
        "Sep": [ 7, 34 ],
        "Nov": [ 3, 34 ],
        "Jan": [ 2, 52 ],
        "Dec": [ 1, 24 ]
    },
    "commit_count_per_owned_repo": {
        "CookInd": 34,
        "Ad-Fatigued-List-Generator": 30,
        ...
    },
    "commit_count_per_other_repo": [
        {
           "name": "generations-frontend",
           "owner": "onlyphantom",
           "html_url": "https://github.com/onlyphantom/generations-frontend",
           "description": "Front end for Fellowship by @supertypeai",
           "commits_count": 70
        },
        {
           "name": "superinference",
           "owner": "supertypeai",
           ...
        },
    ],
    "commit_count_per_repo_org_owner": { 
        "supertypeai": 144,
        "Tech4Impact-21-22": 65 
    },
    "commit_count_per_repo_user_owner": {
        "AurelliaChristie": 200,
        "onlyphantom": 175,
        ...
    }
}

// contribution (issues and pull requests)
{
    "incomplete_issue_results": false,
    "incomplete_pr_results": false,
    "inference_from_issue_count": 2,
    "inference_from_pr_count": 151,
    "merged_pr_count": 108,
    "self_contribution_to_external": {
        "onlyphantom": 109,
        "supertypeai": 67,
        ...
    },
    // incoming contribution count (commits and pull requests from other users)
    // only based on the top and latest 10 repositories
    "external_contribution_to_self": {
        "geraldbryan": 42
    }
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

You can optionally pass in an OAuth token to make authenticated requests to, in the case of GitHub, also be able to extract and infer stats from private repositories not available to the public.

```js
inferFromGithub({ githubHandle:"onlyphantom", token:oauth_token, include_private:true, top_repo_n:10, top_language_n:5 })
```

This returns the top 10 repositories, including private ones, and the top 5 languages using a GitHub OAuth token.

### API Rate Limit

The APIs we use restrict the number of requests that can be made within a set timeframe. If this limit is exceeded, the API looping will cease and we will provide the inference from the data we have collected thus far. To see this information, you can check the following parameters included in the response:
- `incomplete_<item>_results`: Boolean that indicates if the results for `<item>` are incomplete due to reaching the API rate limit.
- `inference_from_<item>_count`: The number of `<item>` got from the API (before reaching the API rate limit).

**Special notes for GitHub API : the API can only return maximum 1,000 results (10 pages) per endpoint. Thus there will be a case where you see the `incomplete_<item>_results` set to `false` while the `inference_from_<item>_count` set to `1,000` even though there supposed to be more than 1,000 `<items>`.**
