module Nyaplot

  # Jsonizable Object to which diagrams are registered
  # Properties of Nyaplot::Plot are embeded into the JSON object as a part of property 'panes' by Nyaplot::Frame
  class Plot
    include Jsonizable

    # !@attributes width
    #   @return [Numeric] the width
    # !@attributes height
    #   @return [Numeric] the height
    # !@attributes margin
    #   @return [Hash] the margin
    # !@attributes xrange
    #   @return [Array<Numeric>, Array<String>, Array<Symbol>] the name of width set
    # !@attributes yrange
    #   @return [Array<Numeric>, Array<String>, Array<Symbol>] the name of width set
    # !@attributes x_label
    #   @return [String] the name of label placed along x-axis
    # !@attributes y_label
    #   @return [String] the name of label placed along y-axis
    # !@attributes bg_color
    #   @return [String] the code of color which background is filled in
    # !@attributes grid_color
    #   @return [String] the code of color which grid lines are filled in
    # !@attributes legend
    #   @return [Boolean] whether to show legend or not
    # !@attributes legend_width
    #   @return [Numeric] the width of legend area
    # !@attributes legend_options
    #   @return [Hash] the name of width set
    # !@attributes zoom
    #   @return [Boolean] whether to enable zooming
    # !@attributes rotate_x_label
    #   @return [Numeric] the angle to rotate x label (radian)
    # !@attributes rotate_y_label
    #   @return [Numeric] the angle to roatte y label (radian)
    define_properties(:diagrams, :filter)
    define_group_properties(:options, [:width, :height, :margin, :xrange, :yrange, :x_label, :y_label, :bg_color, :grid_color, :legend, :legend_width, :legend_options, :zoom, :rotate_x_label, :rotate_y_label])

    def initialize
      init_properties
      set_property(:diagrams, [])
      set_property(:options, {})
      set_property(:width, nil)
      set_property(:legend, nil)
    end

    # Add diagram with Array
    # @param [Symbol] type the type of diagram to add
    # @param [Array<Array>] *data array from which diagram is created
    # @example
    #    plot.add(:scatter, [0,1,2], [0,1,2])
    def add(type, *data)
      labels = data.map.with_index{|d, i| 'data' + i.to_s}
      raw_data = data.each.with_index.reduce({}){|memo, (d, i)| memo[labels[i]]=d; next memo}
      df = DataFrame.new(raw_data)
      return add_with_df(df, type, *labels)
    end

    # Add diagram with DataFrame
    # @param [DataFrame] DataFrame from which diagram is created
    # @param [Symbol] type the type of diagram to add
    # @param [Array<Symbol>] *labels column labels for x, y or some other dimension
    # @example
    #    df = Nyaplot::DataFrame.new({x: [0,1,2], y: [0,1,2]})
    #    plot.add(df, :scatter, :x, :y)
    def add_with_df(df, type, *labels)
      diagram = Diagram.new(df, type, labels)
      diagrams = get_property(:diagrams)
      diagrams.push(diagram)
      return diagram
    end

    # Show plot on IRuby notebook
    def show
      frame = Frame.new
      frame.add(self)
      frame.show
    end

    # @return [Array<String>] names of dataframe used by diagrams belog to this plot
    def df_list
      arr=[]
      diagrams = get_property(:diagrams)
      diagrams.each{|d| arr.push(d.df_name)}
      return arr
    end

    def before_to_json
      diagrams = get_property(:diagrams)

      # set default values when not specified by users
      zoom(true) if diagrams.all?{|d| d.zoom?}

      if width.nil?
        if legend == true
          width(800)
        else
          width(700)
        end
      end

      [:xrange, :yrange].each do |symbol|
        if get_property(:options)[symbol].nil?
          range = []
          diagrams.each{|diagram| range.push(diagram.send(symbol))}

          if range.all? {|r| r.length == 2} # continuous data
            range = range.transpose
            range = [range[0].min, range[1].max]
            self.send(symbol, range)
          else # discrete data
            range.flatten!.uniq!
            self.send(symbol, range)
          end
        end
      end
    end

    # Shortcut method to configure plot
    # @example
    #    plot = Nyaplot::Plot.new
    #    plot.configure do
    #      width(700)
    #      height(700)
    #    end
    def configure(&block)
      self.instance_eval(&block) if block_given?
    end
  end
end
