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

    # generate html code for <body> tag
    def generate_body
      path = File.expand_path("../templates/iruby.erb", __FILE__)
      template = File.read(path)
      id = SecureRandom.uuid()
      model = self.to_json
      ERB.new(template).result(binding)
    end

    # generate static html file
    # @return [String] generated html
    def generate_html
      body = generate_body
      init = Nyaplot.generate_init_code
      path = File.expand_path("../templates/static_html.erb", __FILE__)
      template = File.read(path)
      ERB.new(template).result(binding)
    end

    # export static html file
    def export_html(path="./plot.html")
      path = File.expand_path(path, Dir::pwd)
      str = generate_html
      File.write(path, str)
    end

    # show plot automatically on IRuby notebook
    def to_iruby
      html = generate_body
      ['text/html', html]
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
