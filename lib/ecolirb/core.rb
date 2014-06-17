module Ecolirb
  def self.initialize_iruby
    raise "IRuby notebook is not loaded." unless defined? IRuby

    path = File.expanfd_path("../templates/init.js", __FILE__)
    html = File.read(path)
    return IRuby.html(html)
  end
end
