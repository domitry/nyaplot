require 'erb'

module Nyaplot

  @@dep_libraries = {
    d3:'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min',
    downloadable: 'http://cdn.rawgit.com/domitry/d3-downloadable/master/d3-downloadable'
  }
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
  def self.generate_init_code(assets=:cdn)
    dep_libraries = @@dep_libraries
    additional_libraries = @@additional_libraries
    js_dir = File.expand_path("../js", __FILE__)
    case assets
    when :cdn
      path = File.expand_path("../templates/init.cdn.js.erb", __FILE__)
    when :inline
      path = File.expand_path("../templates/init.inline.js.erb", __FILE__)
    end
    template = File.read(path)
    ERB.new(template).result(binding)
  end

  # Enable to show plots on IRuby notebook
  def self.init_iruby
    js = self.generate_init_code
    IRuby.display(IRuby.javascript(js))
  end

  def self.load_notebook(assets=:inline)
    init_code = generate_init_code(assets)
    case assets
    when :cdn
      IRuby.display(IRuby.javascript(init_code))
    when :inline
      IRuby.display(IRuby.html(<<END_HTML))
<script type="application/javascript">
#{init_code}
</script>
END_HTML
    end
  end
end
