# Fount
The idea is this: you write your front-matter headed markdown files and Fount exposes them to you thorugh a simple REST api.

Why? Because some people like to make websites without getting hot and heavy with blogging platforms, templating systems, and one-size-fits-all tools that, while making it quicker to get started, can restrict the amount of creative control of a project. Fount is an effort to look at the main goal of a blogging platform (the organisation of data) and condense that into a tool that is flexible and easy to build on top of.

## Install
Clone the repo then install by running `npm install` followed by `node app`

## Some examples

Return all posts: `/posts/all`
```
[{
  "attributes": {
    "title": "Something"
  },
  "body": "\nBlah",
  "filename": "my-first-post-2015-01-01.md"
},
{
  "attributes": {
    "title": "Something else"
  },
  "body": "\nBlah",
  "filename": "my-first-post-2015-01-01.md"
}, 
...]
```

Return single post: `/post/:postName`
```
{
  "attributes": {
    "title": "Something"
  },
  "body": "\nBlah",
  "filename": "my-first-post-2015-01-01.md"
}
```