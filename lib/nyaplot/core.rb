require 'erb'

module Nyaplot
  @@dep_libraries = {
    d3:'http://d3js.org/d3.v3.min'
  }

  def self.init_iruby
    raise "IRuby notebook is not loaded." unless defined? IRuby

    path = File.expand_path("../templates/init.html.erb", __FILE__)
    template = File.read(path)
    dep_libraries = @@dep_libraries
    html = ERB.new(template).result(binding)
    return IRuby.html(html)
  end

  def self.add_dependency(name, url)
    @@dep_libraries[name]=url;
  end
end
