require 'erb'

module Nyaplot
  @@dep_libraries = {
    d3:'http://d3js.org/d3.v3.min'
  }

  @@extension_lists = []

  def self.extension_lists
    @@extension_lists
  end

  def self.add_extension(name)
    @@extension_lists.push(name)
  end

  def self.add_dependency(name, url)
    @@dep_libraries[name]=url;
  end

  def self.init_iruby
    path = File.expand_path("../templates/init.js.erb", __FILE__)
    template = File.read(path)
    dep_libraries = @@dep_libraries
    js = ERB.new(template).result(binding)
    IRuby.display(IRuby.javascript(js))
  end

  init_iruby if defined? IRuby
end
