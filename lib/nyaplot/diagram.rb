module Nyaplot

  # Diagram
  # @abstract extended using a module included in Nyaplot::Diagrams
  class Diagram
    include Jsonizable
    define_properties(:type, :data)

    def initialize(df, type, labels)
      init_properties
      mod = Kernel.const_get("Nyaplot").const_get("Diagrams").const_get(type.to_s.capitalize)
      self.extend(mod)
      set_property(:type, type)
      set_property(:options, {})
      set_property(:data, df.name)
      self.process_data(df, labels)
      DataBase.instance.add(df)
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end

    def xrange
      @xrange
    end

    def yrange
      @yrange
    end

    # @return [String] the name of dataframe from which this diagram is generated
    def df_name
      get_property(:data)
    end
  end

  module Diagrams
    module Bar
      include Jsonizable

      # !@attributes value
      #   @return [Symbol] the column label from which bar chart is created
      # !@attributes x
      #   @return [Symbol] the column label from which bar chart is created
      # !@attributes y
      #   @return [Symbol] the column label from which bar chart is created
      # !@attributes width
      #   @return [Numeric] the width of each bar. The specified value should be in the range 0 to 1.
      # !@attributes color
      #   @return [Array<String>] array of color codes
      define_group_properties(:options, [:value, :x, :y, :width, :color])

      # calcurate xrange and yrange from recieved data
      def process_data(df, labels)
        case labels.length
        when 1
          label = labels[0]
          value(label)
          @xrange = df[label].to_a.uniq
          @yrange = [0, df[label].to_a.length]
        when 2
          label_x = labels[0]
          label_y = labels[1]
          x(label_x)
          y(label_y)
          @xrange = df.column(label_x).to_a
          @yrange = [(df[label_y].to_a.min < 0 ? df[label_y].to_a.min : 0), df[label_y].to_a.max]
        end
      end

      # internal use. Nyaplot::Plot asks diagram through this method whether to enable zooming option or not.
      def zoom?
        false
      end
    end

    module Histogram
      include Jsonizable

      # !@attributes value
      #   @return [Symbol] the column label from which histogram is created
      # !@attributes width
      #   @return [Symbol] the width of each bar. The specified value should be in the range 0 to 1.
      # !@attributes color
      #   @return [Array<String>] array of color codes
      # !@attributes stroke_color
      #   @return [String] color code
      # !@attributes stroke_width
      #   @return [Numeric] the width of stroke
      define_group_properties(:options, [:title, :value, :bin_num, :width, :color, :stroke_color, :stroke_width])

      def process_data(df, labels)
        label = labels[0]
        value(label)
        @xrange = [(df[label].to_a.min < 0 ? df[label].to_a.min : 0), df[label].to_a.max]
        @yrange = [0, df[label].to_a.length]
      end

      def zoom?
        false
      end
    end

    module Venn
      include Jsonizable

      # !@attributes category
      #   @return [Symbol] the column label from which the venn diagram is created
      # !@attributes count
      #   @return [Symbol] the column label from which the venn diagram is created
      # !@attributes area_names
      #   @return [Symbol] the width of each bar. The specified value should be in the range 0 to 1.
      # !@attributes filter_control
      #   @return [Array<String>] array of color codes
      # !@attributes opacity
      #   @return [String] color code
      # !@attributes color
      #   @return [Numeric] the width of stroke
      # !@attributes stroke_color
      #   @return [String] color code
      # !@attributes stroke_width
      #   @return [Numeric] the width of stroke
      define_group_properties(:options, [:title, :category, :count, :area_names, :filter_control, :opacity, :color, :stroke_color, :stroke_width])

      def process_data(df, labels)
        category(labels[0])
        count(labels[1])
        @xrange = [0, 10]
        @yrange = [0, 10]
      end

      def zoom?
        false
      end
    end

    module Scatter
      include Jsonizable

      # !@attributes title
      #   @return [String] the title of this chart
      # !@attributes x
      #   @return [Symbol] the column label from which the line chart is created
      # !@attributes y
      #   @return [Symbol] the column label from which the line chart is created
      # !@attributes fill_by
      #   @return [Symbol] the column label to decide how to fill sybmols
      # !@attributes shape_by
      #   @return [Symbol] the column label to decide shapes
      # !@attributes size_by
      #   @return [Symbol] the column label to decide size of symbols
      # !@attributes color
      #   @return [Array<String>] color code
      # !@attributes shape
      #   @return [Array<String>] shapes for each symbol
      # !@attributes size
      #   @return [Array<String>] the range of symbol size
      # !@attributes stroke_color
      #   @return [String] color code
      # !@attributes stroke_width
      #   @return [Numeric] the width of stroke
      # !@attributes tooltip_contents
      #   @return [Array<Symbol>] column labels to display in tool-tip box
      define_group_properties(:options, [:title, :x, :y, :fill_by, :shape_by, :size_by, :color, :shape, :size, :stroke_color, :stroke_width, :tooltip_contents])

      def process_data(df, labels)
        label_x = labels[0]
        label_y = labels[1]
        x(label_x)
        y(label_y)
        @xrange = [df[label_x].to_a.min, df[label_x].to_a.max]
        @yrange = [df[label_y].to_a.min, df[label_y].to_a.max]
      end

      def zoom?
        true
      end
    end

    module Vectors
      include Jsonizable
      define_group_properties(:options, [:title, :x, :y, :dx, :dy, :fill_by, :color, :stroke_color, :stroke_width, :hover])

      def process_data(df, labels)
        label_x = labels[0]
        label_y = labels[1]
        x(label_x)
        y(label_y)
        @xrange = [df[label_x].to_a.min, df[label_x].to_a.max]
        @yrange = [df[label_y].to_a.min, df[label_y].to_a.max]
      end

      def zoom?
        true
      end
    end

    module Line
      include Jsonizable

      # !@attributes title
      #   @return [String] the title of this chart
      # !@attributes x
      #   @return [Symbol] the column label from which the line chart is created
      # !@attributes y
      #   @return [Symbol] the column label from which the line chart is created
      # !@attributes color
      #   @return [String] the color code
      # !@attributes stroke_width
      #   @return [Numeric] the width of stroke
      define_group_properties(:options, [:title, :x, :y, :color, :stroke_width])

      def process_data(df, labels)
        label_x = labels[0]
        label_y = labels[1]
        x(label_x)
        y(label_y)
        @xrange = [df[label_x].to_a.min, df[label_x].to_a.max]
        @yrange = [df[label_y].to_a.min, df[label_y].to_a.max]
      end

      def zoom?
        true
      end
    end

    module Box
      include Jsonizable

      # !@attributes title
      #   @return [String] the title of this chart
      # !@attributes x
      #   @return [Symbol] the column label from which box chart is created
      # !@attributes y
      #   @return [Symbol] the column label from which box chart is created
      # !@attributes area_names
      #   @return [Symbol] the width of each bar. The specified value should be in the range 0 to 1.
      # !@attributes filter_control
      #   @return [Array<String>] array of color codes
      # !@attributes opacity
      #   @return [String] color code
      # !@attributes color
      #   @return [Numeric] the width of stroke
      # !@attributes stroke_color
      #   @return [String] color code
      # !@attributes stroke_width
      #   @return [Numeric] the width of stroke
      define_group_properties(:options, [:title, :value, :width, :color, :stroke_color, :stroke_width, :outlier_r])

      def process_data(df, labels)
        value(labels)
        yrange = [Float::INFINITY, -Float::INFINITY]

        proc = Proc.new do |column|
          yrange[0] = [yrange[0], column.min].min
          yrange[1] = [yrange[1], column.max].max
        end

        raw_data = labels.map{|label| df[label].to_a}
        raw_data.each{|column| proc.call(column)}
        @xrange = labels
        @yrange = yrange
      end

      def zoom?
        false
      end
    end

    module Heatmap
      include Jsonizable

      # !@attributes title
      #   @return [String] the title of this chart
      # !@attributes x
      #   @return [Symbol] the column label from which histogram is created
      # !@attributes y
      #   @return [Symbol] the column label from which histogram is created
      # !@attributes fill
      #   @return [Symbol] the column label
      # !@attributes width
      #   @return [String] the width
      # !@attributes height
      #   @return [String] the height
      # !@attributes color
      #   @return [Array<String>] array of color codes
      # !@attributes stroke_color
      #   @return [String] color code
      # !@attributes stroke_width
      #   @return [Numeric] the width of stroke
      # !@attributes hover
      #   @return [Boolean] whether to change color when hovering
      define_group_properties(:options, [:title, :x, :y, :fill, :width, :height, :color, :stroke_color, :stroke_width, :hover])

      def process_data(df, labels)
        label_x = labels[0]
        label_y = labels[1]
        label_fill = labels[2]
        x(label_x)
        y(label_y)
        fill(label_fill)
        @xrange = [df[label_x].to_a.min, df[label_x].to_a.max]
        @yrange = [df[label_y].to_a.min, df[label_y].to_a.max]
      end

      def zoom?
        true
      end
    end
  end
end
