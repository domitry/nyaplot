require 'erb'
require 'securerandom'

module Nyaplot

  # Jsonizable Object which holds Plots (panes) in it.
  class Frame
    include Jsonizable

    define_properties(:data, :panes, :extension)

    def initialize
      init_properties
      set_property(:panes, [])
      set_property(:data, {})
    end

    # Add new pane to the frame
    # @param [Nyaplot::Plot] the pane to add
    def add(plot)
      data = get_property(:data)
      plot.df_list.each do |name|
        data[name] = DataBase.instance.fetch(name)
      end
      panes = get_property(:panes)
      panes.push(plot)
    end

    # export static html file
    # @return [String] generated html
    def export_html
      path = File.expand_path("../templates/static_html.erb", __FILE__)
      template = File.read(path)
      model = self.to_json
      html = ERB.new(template).result(binding)
      html
    end

    # show plot automatically on IRuby notebook
    def to_iruby
      path = File.expand_path("../templates/iruby.erb", __FILE__)
      template = File.read(path)
      id = SecureRandom.uuid()
      model = self.to_json
      ['text/html', ERB.new(template).result(binding)]
    end

    # show plot on IRuby notebook
    def show
      IRuby.display(self)
    end

    def before_to_json
      set_property(:extension, Nyaplot.extension_lists)
    end
  end
end
