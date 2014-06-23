module Nyaplot
  def self.init_iruby
    raise "IRuby notebook is not loaded." unless defined? IRuby

    path = File.expand_path("../templates/init.js", __FILE__)
    html = '<script>' + File.read(path) + '</script>'
    return IRuby.html(html)
  end
end
