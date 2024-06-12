# Introduction

# honkit-plugin-gitlab-comment

use gitlab issue for honkit bolg comment

## How to install

```sh
npm install honkit-plugin-gitlab-comment
```

or

```sh
yarn add honkit-plugin-gitlab-comment
```

## How to usage

Add settings to book.json


###support md file

###support(url, accessToken)

### url: gitlab issue url (url cannot be omitted.)
### accessToken: gitlab sender accessToken (accessToken cannot be omitted.)

```json
{
  "plugins": ["gitlab-comment"],
  "pluginsConfig": {
    "gitlab-comment": {
      "url": "https://gitlab.com/api/v4/projects/{projectId}/issues/{issueId}/notes",
      "accessToken": "gitlab user access token"
    }
  }
}
```

