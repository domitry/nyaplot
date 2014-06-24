module Nyaplot
  class Plot
    include Nyaplot::Base

    define_properties(Array, :diagrams)
    define_group_properties(:options, [:width, :height, :margin, :xrange, :yrange, :x_label, :y_label, :bg_color, :grid_color, :legend, :legend_width, :legend_options])

    def add(type, *data)
      diagram = Diagram.new(type, data)
      #register data to current frame
      @properties[:diagrams].push(diagram)
      return diagram
    end

    def show()
      
      frame.add(self)
      frame.show
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end
  end
end
