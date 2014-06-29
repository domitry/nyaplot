module Nyaplot
  class Plot
    include Jsonizable

    define_properties(Array, :diagrams)
    define_group_properties(:options, [:width, :height, :margin, :xrange, :yrange, :x_label, :y_label, :bg_color, :grid_color, :legend, :legend_width, :legend_options, :zoom])

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
      frame.init_panes # TODO: remove this line
      frame.add(self)
      frame.show
    end

    def before_to_json
      diagrams = get_property(:diagrams)

      [:xrange, :yrange].each do |symbol|
        if get_property(symbol).nil?
          range = []
          diagrams.each{|diagram| range.push(diagram.send(symbol))}

          if range.all? {|r| r.length == 2}
            range = range.transpose
            range = [range[0].min, range[1].max]
            self.send(symbol, range)
          else
            range.flatten!.uniq!
            self.send(symbol, range)
          end
        end
      end
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end
  end
end
