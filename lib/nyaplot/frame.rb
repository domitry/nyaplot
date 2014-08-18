require 'erb'
require 'securerandom'

module Nyaplot
  class Frame
    include Jsonizable

    define_properties(:data, :panes, :extension)

    def initialize
      init_properties
      set_property(:panes, [])
      set_property(:data, {})
    end

    def add(plot)
      data = get_property(:data)
      plot.df_list.each do |name|
        data[name] = DataBase.instance.fetch(name)
      end
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

    def before_to_json
      set_property(:extension, Nyaplot.extension_lists)
    end
  end
end
