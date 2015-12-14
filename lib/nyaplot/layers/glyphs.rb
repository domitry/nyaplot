module Nyaplot
  module Layers
    class Area < LayerBase
      define_args :data, :x, :y0, :y1, :position
      define_args :color, :stroke_color, :stroke_width, :interpolate, :transpose, :opacity
    end

    class Circle < LayerBase
      define_args :data, :x, :y, :position
      define_args :radius, :color, :stroke_color, :stroke_width, :opacity
    end

    # deprecated
    class Histogram < LayerBase
      define_args :data, :value, :position, :scalex
      define_args :bin_num, :width, :color, :stroke_width, :stroke_color
    end

    class Line < LayerBase
      define_args :data, :x, :y, :position
      define_args :color, :stroke_width, :dashed, :dasharray, :fill_color
    end

    class Rect < LayerBase
      define_args :data, :x1, :y1, :x2, :y2, :position
      define_args :color, :stroke_width, :stroke_color, :center_x, :center_y, :rotate
    end

    class Scatter < LayerBase
      define_args :data, :x, :y, :position
    end

    class Text < LayerBase
      define_args :data, :x, :y, :position
      define_args :text, :color, :font_size, :text_anchor, :dominant_baseline
    end

    class Vectors < LayerBase
      define_args :data, :x1, :y1, :x2, :y2, :position
      define_args :color, :fill_color, :stroke_color, :with_arrow
    end
  end
end
