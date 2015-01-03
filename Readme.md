# Fount: Be your own api
The idea is this: you write your front-matter headed markdown files and Fount exposes them to you thorugh a simple REST api.

Why? Because some people like to build websites without getting hot and heavy with blogging platforms, templating systems, and one-size-fits-all tools that, while making it quicker to get started, can restrict the amount of creative control one has over the final product. Fount is an effort to look at the main goal of the blogging platform (the organisation of data) and condensing it into a tool that is flexible and easy to build on top of.

*WARNING* This might not work

## Install
Clone the repo then install by running `npm install` followed by `node app`

## Some examples

Return all posts: `/posts/all`
```
{
  posts: [
    {
      frontmatter: {
        image: "http://url.to/image.jpg"
      },
      body: " # Here's the thing Or is it here? ## Who knows Fin.",
      slug: "all-the-things",
      title: "All the Things",
      published_date: "Wed Dec 24 2014 00:00:00 GMT+0000 (GMT)",
      filename: "all-the-things-2014-12-24.md"
    },
    {
      frontmatter: {
        title: "A replacement title"
      },
      body: " Looking at a 2D projection of reality and we think we know it all.",
      slug: "abstractions-and-stuff",
      title: "A replacement title",
      published_date: "Wed Oct 29 2014 00:00:00 GMT+0000 (GMT)",
      filename: "abstractions-and-stuff-2014-10-29.md"
    }, 
    ...
  ]
}
```

Return single post: `/post/:postName`
```
{
  post: [{
    frontmatter: {
      title: "A replacement title"
    },
    body: " Looking at a 2D projection of reality and we think we know it all.",
    slug: "abstractions-and-stuff",
    title: "A replacement title",
    published_date: "Wed Oct 29 2014 00:00:00 GMT+0000 (GMT)",
    filename: "abstractions-and-stuff-2014-10-29.md"
  }]
}
```