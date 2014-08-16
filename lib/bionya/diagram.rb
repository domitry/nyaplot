module Nyaplot
  module Diagrams
    module Arc
      include Jsonizable
      define_group_properties(:options, [:range, :width, :color, :fill_by, :x, :y, :layer, :axis])

      def process_data(df, labels)
        x(labels[0])
        y(labels[1])

        nested = df.column(labels[2]) # 'nested_label' column from CircularPlot
        raise 'received dataframe is not nested' unless nested.all? {|cell| cell.is_a? DataFrame}
        max = nested.reduce(-Float::INFINITY){|memo, df| [memo, df.column(y).max].max}
        range([0, max])
      end
    end

    module Labels
      include Jsonizable
      define_group_properties(:options, [:color, :fill_by, :x, :text, :stroke_width, :layer, :text_size])

      def process_data(df, labels)
        x(labels[0])
        text(labels[1])
      end
    end

    module Connector
      include Jsonizable
      define_group_properties(:options, [:color, :fill_by, :from, :to, :shape, :stroke_width, :size, :shape_fill, :shape_stroke, :shape_stroke_width, :arc_height, :layer])

      def process_data(df, labels)
        from(labels[0])
        to(labels[1])
      end
    end
  end
end
