require "set"

module Jekyll
  class TagPageGenerator < Generator
    safe true
    priority :low

    COLLECTIONS = %w[writing building notes marginalia].freeze

    def generate(site)
      all_docs = COLLECTIONS.flat_map do |name|
        collection = site.collections[name]
        collection ? collection.docs : []
      end

      existing_urls = site.pages.map(&:url).to_set

      all_docs.flat_map { |doc| Array(doc.data["tags"]) }.uniq.each do |tag|
        slug = Jekyll::Utils.slugify(tag.to_s)
        next if slug.empty?
        next if File.exist?(File.join(site.source, "tag", "#{slug}.md"))

        url = "/tag/#{slug}/"
        next if existing_urls.include?(url)

        site.pages << TagPage.new(site, site.source, slug, tag)
        existing_urls << url
      end
    end
  end

  class TagPage < Page
    def initialize(site, base, slug, tag)
      @site = site
      @base = base
      @dir = File.join("tag", slug)
      @name = "index.html"

      process(@name)
      read_yaml(File.join(base, "_layouts"), "tag.html")
      data["tag"] = tag
      data["title"] = titleize(tag)
    end

    private

    def titleize(tag)
      return "ML" if tag.to_s.downcase == "ml"

      tag.to_s.split.map(&:capitalize).join(" ")
    end
  end
end
