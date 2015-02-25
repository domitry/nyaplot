require 'erb'

module Nyaplot

  @@dep_libraries = {d3:'http://d3js.org/d3.v3.min'}
  @@additional_libraries = {}
  @@extension_lists = []

  def self.extension_lists
    @@extension_lists
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

  # generate initializing code
  def self.generate_init_code
    path = File.expand_path("../templates/init.js.erb", __FILE__)
    template = File.read(path)
    dep_libraries = @@dep_libraries
    additional_libraries = @@additional_libraries
    js = ERB.new(template).result(binding)
    js
  end

  def self.start_debug(port=9996)
    require 'webrick'
    path = File.expand_path("../../../nyaplotjs/release", __FILE__)
    `ruby -e httpd #{path} -p #{port}`

    js = self.generate_init_code
    js.gsub!("http.+nyaplot.js", "http://localhost:" + port.to_s + "/nyaplot.js")
    IRuby.display(IRuby.javascript(js))
  end

  # Enable to show plots on IRuby notebook
  def self.init_iruby
    js = self.generate_init_code
    IRuby.display(IRuby.javascript(js))
  end

  # Create multi-column layout
  # @example
  #   include Nyaplot
  #   p1 = Plot.add(:scatter, x1, y1)
  #   p2 = Plot.add(:line, x2, y2)
  #   columns(p1, p2).draw
  #
  def columns(*plots)
    panes = plots.map{|p| p.pane}
    plot = Plot.new
    plot.pane = Pane.columns(*panes)
    plot
  end

  # Create multi-row layout
  # @example
  #   include Nyaplot
  #   p1 = Plot.add(:scatter, x1, y1)
  #   p2 = Plot.add(:line, x2, y2)
  #   p3 = Plot.add(:bar, x3, y3)
  #   rows(columns(p1, p2), p3).draw
  #
  def rows(*plots)
    panes = plots.map{|p| p.pane}
    plot = Plot.new
    plot.pane = Pane.rows(*panes)
    plot
  end

  if $DEBUG_NYAPLOT == true
    start_debug
  else
    init_iruby if defined? IRuby
  end
end
