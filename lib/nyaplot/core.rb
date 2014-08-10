require 'erb'

module Nyaplot
  # the lists of libraries loaded before Nyaplot.js
  @@dep_libraries = {
    d3:'http://d3js.org/d3.v3.min'
  }

  # libraries loaded after Nyaplot.js
  @@additional_libraries = {}

  @@extension_lists = []

  def self.extension_lists
    @@extension_lists
  end

  def self.init_iruby
    raise "IRuby notebook is not loaded." unless defined? IRuby

    path = File.expand_path("../templates/init.html.erb", __FILE__)
    template = File.read(path)
    dep_libraries = @@dep_libraries
    additional_libraries = @@additional_libraries
    html = ERB.new(template).result(binding)
    return IRuby.html(html)
  end

  def self.add_extension(name)
    @@extension_lists.push(name)
  end

  def self.add_dependency(name, url)
    @@dep_libraries[name]=url;
  end

  def self.add_additional_library(name, url)
    @@additional_libraries[name]=url
  end
end
