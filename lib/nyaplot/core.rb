require 'erb'

module Nyaplot

  @@dep_libraries = {d3:'http://d3js.org/d3.v3.min'}
  @@additional_libraries = {}
  @@extension_lists = []

  def self.extension_lists
    @@extension_lists
  end

  # Enable to show plots on IRuby notebook
  # @raise [RuntimeError] Raise error when being ran environment except IRuby notebook.
  def self.init_iruby
    raise "IRuby notebook is not loaded." unless defined? IRuby

    path = File.expand_path("../templates/init.html.erb", __FILE__)
    template = File.read(path)
    dep_libraries = @@dep_libraries
    additional_libraries = @@additional_libraries
    html = ERB.new(template).result(binding)
    return IRuby.html(html)
  end

  # Tell JavaScript back-end library to load some extension libraries
  # @param [String] name The name of JavaScript extension library to load
  def self.add_extension(name)
    @@extension_lists.push(name)
  end

  # Load extension library to IRuby notebook after Nyaplotjs is loaded
  def self.add_dependency(name, url)
    @@dep_libraries[name]=url;
  end

  # Load extension library to IRuby notebook before Nyaplotjs is loaded
  def self.add_additional_library(name, url)
    @@additional_libraries[name]=url
  end
end
