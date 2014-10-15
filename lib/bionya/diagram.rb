module Nyaplot
  module Diagrams
    module Arc
      include Jsonizable
      # @!attribute range
      #   @return [Array<Numeric>] The range of values on y-axis
      # @!attribute width
      #   @return [Numeric] The width of bars [0..1]
      # @!attribute color
      #   @return [Array<String>] colors in which arcs are filled
      # @!attribute fill_by
      #   @return [Symbol] the column label to decide how to fill sybmols
      # @!attribute layer
      #   @return [Numeric] The number of layer where the plot is placed
      # @!attribute axis
      #   @return [Boolean] Boolean whether to render axis along arcs
      define_group_properties(:options, [:range, :width, :color, :fill_by, :x, :y, :layer, :axis])

      def process_data(df, labels)
        x(labels[0])
        y(labels[1])

        nested = df.column(labels[2]) # 'nested_label' column from CircularPlot
        raise 'received dataframe is not nested' unless nested.all? {|cell| cell.is_a? Daru::DataFrame}
        max = nested.reduce(-Float::INFINITY){|memo, df| [memo, df.column(y).max].max}
        min = nested.reduce(Float::INFINITY){|memo, df| [memo, df.column(y).min].min}
        if min > 0
          range([0, max])
        else
          range([min, max])
        end
      end
    end

    module Labels
      include Jsonizable
      # @!attribute color
      #   @return [Array<String>] colors in which texts are filled
      # @!attribute fill_by
      #   @return [Symbol] the column label to decide how to fill sybmols
      # @!attribute color
      #   @return [Array<String>] colors in which texts are filled
      # @!attribute stroke_width
      #   @return [Numeric] the width of stroke
      # @!attribute layer
      #   @return [Numeric] The number of layer where the plot is placed
      # @!attribute text_size
      #   @return [Numeric] The size of text
      define_group_properties(:options, [:color, :fill_by, :x, :text, :stroke_width, :layer, :text_size])

      def process_data(df, labels)
        x(labels[0])
        text(labels[1])
      end
    end

    module Connector
      include Jsonizable
      # @!attribute color
      #   @return [Array<String>] colors in which texts are filled
      # @!attribute fill_by
      #   @return [Symbol] the column label to decide how to fill sybmols
      # @!attribute shape
      #   @return [Array<String>] the shape of symbols
      # @!attribute stroke_width
      #   @return [Numeric] the width of stroke
      # @!attribute size
      #   @return [Numeric] The size of shape
      # @!attribute shape_fill
      #   @return [String] The color of shape
      # @!attribute shape_stroke
      #   @return [String] The color of stroke for shape
      # @!attribute shape_stroke_width
      #   @return [Numeric] The thickness of stroke for shape
      # @!attribute arc_height
      #   @return [Numeric] The height of arc line
      # @!attribute layer
      #   @return [Numeric] The number of layer where the plot is placed
      define_group_properties(:options, [:color, :fill_by, :from, :to, :shape, :stroke_width, :size, :shape_fill, :shape_stroke, :shape_stroke_width, :arc_height, :layer])

      def process_data(df, labels)
        from(labels[0])
        to(labels[1])
      end
    end
  end
end
