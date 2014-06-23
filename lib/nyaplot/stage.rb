require 'erb'
require 'securerandom'

module Nyaplot
  class Stage
    include Nyaplot::Base

    define_properties(Hash, :data)
    define_properties(Array, :panes)
    define_properties(Hash, :options)

    def initialize(&block)
      self.instance_eval(&block) if block_given?
    end

    def to_html
      path = File.expand_path("../templates/static_html.erb", __FILE__)
      template = File.read(path)
      model = self.to_json
      html = ERB.new(template).result(binding)
      return html
    end

    def show
      path = File.expand_path("../templates/iruby.erb", __FILE__)
      template = File.read(path)
      id = SecureRandom.uuid()
      model = self.to_json
      html = ERB.new(template).result(binding)
      return IRuby.html(html)
    end
  end
end
