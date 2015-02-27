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
    end

    class Scatter < Glyph::Glyph2D
      required_args :data, :x, :y, :position
      optional_args :color, :shape, :size, :stroke_color, :stroke_width
      type :scatter

      # Change symbol size according to data in specified column
      def size_by(column_name)
        scale = Nyaplot::RowScale.new(data: data, column: column_name)
        range = size.nil? ? [10, 100] : size
        scale.range(range)
        self.size(size)
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
        scale = Nyaplot::RowScale.new(data: data, column: column_name)
        range = shape.nil? ? ['circle','triangle-up', 'diamond', 'square', 'triangle-down', 'cross'] : shape
        scale.range(range)
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

    class Bar < Glyph::Rect
      # @example
      # Plot.new(:bar, x: :[:hoge, :nya, :nyan], y: [100, 200, 10])
      # -> df = DataFrame.new(x: [:hoge, :nya, :nyan], y: [100, 200, 10])
      # -> Bar.new(x: :x, y: :y).data(df)
      #
      def initialize(*args)
        super()
        y_base "bottom"
        x_base "center"
      end

      # descrete
      def range_x
        data[x]
      end

      def range_y
        column = data[@y_label]
        min = column.min < 0 ? column.min : 0
        [min, column.max]
      end

      def position(pos)
        yscale = pos.y # Nyaplot::Scale
        RowScale.new()
        height()
      end
    end

    class HeatMap < Glyph::Rect
    end

    class Box < Glyph::Rect
      def initialize
      end
    end
  end
end
