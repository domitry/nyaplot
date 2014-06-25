require 'erb'
require 'securerandom'
require 'singleton'

module Nyaplot
  class Frame
    include Jsonizable
    include Singleton

    define_properties(Hash, :data)
    define_properties(Array, :panes)

    def initialize()
      init_properties
      set_property(:panes, [])
      set_property(:data, {})
    end

    def add(plot)
      panes = get_property(:panes)
      panes.push(plot)
    end

    def export_html
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

    def register_data(df)
      data = get_property(:data)
      set_property(:data, data)
      data[df.name] = df
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end
  end
end
