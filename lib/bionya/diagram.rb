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
  end
end
