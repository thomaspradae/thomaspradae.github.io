module Jekyll
  class TagPageGenerator < Generator
    safe true

    def generate(site)
      # Initialize an empty array to hold all documents
      all_docs = []
    
      # Add posts
      all_docs.concat(site.posts.docs)
    
      # Add documents from each specified collection
      site.collections.each do |name, collection|
        all_docs.concat(collection.docs) if ['building', 'writing', 'notes'].include?(name)
      end
    
      # Now `all_docs` contains all the posts and documents from specified collections
      tags = all_docs.flat_map { |doc| doc.data['tags'] || [] }.to_set
      tags.each do |tag|
        site.pages << TagPage.new(site, site.source, tag)
      end
    end
    
  end

  class TagPage < Page
    def initialize(site, base, tag)
      @site = site
      @base = base
      @dir  = File.join('tag', tag)
      @name = 'index.html'

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'tag.html')
      self.data['tag'] = tag
      self.data['title'] = "Tag: #{tag}"
    end
  end
end