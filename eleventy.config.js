export default function (eleventyConfig) {
  eleventyConfig.addFilter("year", () => new Date().getFullYear());
  eleventyConfig.addNunjucksGlobal("faqLd", (faq) =>
    (faq || []).map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: String(a).replace(/<[^>]+>/g, "") } }))
  );
  eleventyConfig.addPassthroughCopy("src/wp-content");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addCollection("sitemap", (api) =>
    api.getAll().filter((p) => p.url && !p.data.noindex && p.outputPath?.endsWith(".html"))
  );
  return {
    dir: { input: "src", output: "_site" },
    htmlTemplateEngine: false,
    markdownTemplateEngine: "njk",
  };
}
