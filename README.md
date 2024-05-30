# Introduction

# honkit-plugin-gitlab-disqus

use gitlab issue for honkit bolg disqus

## How to install

```sh
npm install honkit-plugin-gitlab-disqus
```

or

```sh
yarn add honkit-plugin-gitlab-disqus
```

## How to usage

Add settings to book.json

url cannot be omitted.
accessToken cannot be omitted.

```json
{
  "plugins": ["gitlab-disqus"],
  "pluginsConfig": {
    "gitlab-disqus": {
      "url": "https://gitlab.com/api/v4/projects/{projectId}/issues/{issueId}/notes",
      "accessToken": "gitlab user access token"
    }
  }
}
```

