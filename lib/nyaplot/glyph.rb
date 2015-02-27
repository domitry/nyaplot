module Nyaplot
  module Glyph
    class << self
      #@example
      # Nyaplot::Glyph.instantiate(:scatter)
      def instantiate(df, name, hash)
        glyph = Kernel
          .const_get("Nyaplot")
          .const_get("Glyph")
          .const_get(name.to_s.capitalize)

        hash[:data] = df
        glyph.new(hash)
      end
    end

    class Glyph2D
      include Nyaplot::Base
      optional_args :transform

      def range(label)
        if data[label].all? {|v| v.is_a? Numeric}
          [data[label].min, data[label].max]
        else
          data[label].uniq
        end
      end

      def range_x
        range(x)
      end

      def range_y
        range(y)
      end

      def position(*args) ; end
    end

    class Histogram < Glyph::Glyph2D
      required_args :data, :value, :position, :scalex
      optional_args :bin_num, :width, :color, :stroke_color, :stroke_width
      type :histogram

      def initialize(*args)
        super
        bin_num(20)
      end

      def before_to_json
        scalex(position.x)
      end

      def range_x
        [data[value].min, data[value].max]
      end

      def range_y
        min, max = range_x
        bin = (max - min)/bin_num
        max_bin = (1..bin_num).to_a
          .map{|val| [min+bin*(val-1), min+bin*val]}
          .map{|range| data[value].to_a.select{|val| val>=range[0] && val<range[1]}.length}
          .max
        print max_bin
        [0, max_bin*1.2]
      end
    end

    class Scatter < Glyph::Glyph2D
      required_args :data, :x, :y, :position
      optional_args :color, :shape, :size, :stroke_color, :stroke_width
      type :scatter

      # Change symbol size according to data in specified column
      def size_by(column_name)
        range = size.nil? ? [10, 100] : size
        df_scale = Nyaplot::DataFrameScale.new(data: data, column: column_name, range: range)
        scale = Nyaplot::RowScale.new(column: column_name, scale: df_scale)
        self.size(scale)
      end

      # Change symbol shape according to data in specified column
      # Value range (ex. "circle", "diamond", ...) can be specified using Scatter#shape
      # @example
      #   x = ["a", "b", "a"]; y = [1, 2, 3]
      #   sc = Scatter.new(data: data, x: :x, y: :y)
      #   sc.shape_by(:x) #-> circle, triangle-up, circle (default)
      #   sc.shape([:square, :cross]).shape_by(:x) #-> square, cross, square
      #
      def shape_by(column_name)
        range = shape.nil? ? ['circle','triangle-up', 'diamond', 'square', 'triangle-down', 'cross'] : shape
        df_scale = Nyaplot::DataFrameScale.new(data: data, column: column_name, range: range)
        scale = Nyaplot::RowScale.new(column: column_name, scale: df_scale)
        self.shape(scale)
      end
    end

    class Line < Glyph::Glyph2D
      required_args :data, :x, :y, :position
      optional_args :color, :stroke_width
      type :line
    end

    class Rect < Glyph::Glyph2D
      required_args :data, :x, :y
      optional_args :width, :height, :color, :stroke_width, :stroke_color, :x_base, :y_base
      type :rect
    end

    class LineSegment < Glyph::Glyph2D
      required_args :data, :x1, :y1, :x2, :y2
      optional_args :color, :stroke_width
      type :line_segment
    end

    class Bar < Glyph::Rect
      optional_args :bin_size

      # @example
      # Plot.new(:bar, x: :[:hoge, :nya, :nyan], y: [100, 200, 10])
      # -> df = DataFrame.new(x: [:hoge, :nya, :nyan], y: [100, 200, 10])
      # -> Bar.new(x: :x, y: :y).data(df)
      #
      def initialize(*args)
        super()
        y_base "bottom"
        bin_size 0.8
        data args.first[:data]
        @x_label = args.first[:x]
        @y_label = args.first[:y]
      end

      def range_x
        data[@x_label]
      end

      def range_y
        column = data[@y_label]
        min = column.min < 0 ? column.min : 0
        [min, column.max]
      end

      def position(pos)
        x RowScale.new(column: @x_label, scale: pos.x)
        y(pos.y.range.max)
        scale = Scale.new(range: pos.y.range.reverse, domain: pos.y.domain, type: pos.y.type)
        height RowScale.new(column: @y_label, scale: scale)
        width((pos.x.range.max/self.range_x.length)*bin_size)
      end
    end

    class HeatMap < Glyph::Rect
    end

    class Box < Glyph::Rect
      optional_args :bin_size
      attr_reader :child

      # @example
      #   df = DataFrame.new({hoge: [1,2,3], nya: [2,3,4], nyan: [5,6,7]})
      #   Plot.from(df).add(:box, :columns: [:hoge, :nya, :nyan])
      #
      def initialize(*args)
        super()
        bin_size 0.9
        rows = args.first[:columns].map do |label|
          column = args.first[:data][label]
          q1, q3 = column.percentil(25), column.percentil(75)
          h = q3 - q1
          min = q1 - column.min > 1.5*h ? q1-1.5*h : column.min
          max = column.max - q3 > 1.5*h ? q3+1.5*h : column.max
          [
            label,
            max,
            min,
            q1,
            q3,
            q3 - q1,
            column.median,
            column.to_a.select{|val| val < min || val > max}.to_a
          ]
        end

        columns = rows.transpose
        @outlier = columns.pop
        @child = LineSegment.new

        class << @child
          def range_x ; []; end
          def range_y ; [Float::INFINITY, -Float::INFINITY]; end
        end

        add_dependency(@child)
        data(DataFrame.new(columns, labels: [:label, :max, :min, :q1, :q3, :height, :median]))
      end

      def range_x
        data[:label]
      end

      def range_y
        [data[:min].min, data[:max].max]
      end

      def position(pos)
        padding = pos.x.range.max/data.length

        x RowScale.new(column: :label, scale: pos.x)
        y RowScale.new(column: :q3, scale: pos.y)
        height RowScale.new(column: :height, scale: pos.y)
        width padding * bin_size
        transform("translate(" + ((padding*(1-bin_size))/2).to_s  + ",0)")

        @child
          .data(data)
          .x1(self.x)
          .x2(self.x)
          .y1(RowScale.new(column: :min, scale: pos.y))
          .y2(RowScale.new(column: :max, scale: pos.y))
          .stroke_width(1.5)
          .color("#000")
          .transform("translate(" + (padding/2).to_s + ",0)")
      end
    end
  end
end
