module Nyaplot
  class Plot
    include Jsonizable

    define_properties(Array, :diagrams)
    define_group_properties(:options, [:width, :height, :margin, :xrange, :yrange, :x_label, :y_label, :bg_color, :grid_color, :legend, :legend_width, :legend_options])

    def initialize
      set_property(:diagrams, [])
    end

    def add(type, *data)
      diagram = Diagram.new(type, data)
      diagrams = get_property(:diagrams)
      diagrams.push(diagram)
      return diagram
    end

    def show
      frame = Frame.instance
      frame.add(self)
      frame.show
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end
  end
end
