require_relative './base'
require_relative './tools'
require_relative './glyphs'
require_relative './html'

module Nyaplot
  module Layers
    class Axis < LayerBase
      define_args :scale, :text_color, :axis_color, :tick_color, :stroke_width, :orient, :ticks
    end
    
    class Background < LayerBase
      define_args :dx, :dy, :width, :height, :color, :stroke_width, :stroke_color
    end

    class Column < LayerBase
      define_args :percent
    end

    class Context < LayerBase
      define_args :width, :height, :x_align, :y_align
    end

    class Grid < LayerBase
      define_args :width, :height, :color, :stroke_width, :dashed
    end

    class Label < LayerBase
      define_args :text, :dx, :dy, :width, :height, :x_align, :y_align, :text_anchor
      define_args :dominant_baseline, :font_size, :color, :rotate, :margin
    end

    class Legend < LayerBase
      define_args :dx, :dy, :colors, :default_color, :text_color, :font_size
      define_args :radius, :fill_color, :stroke_color, :stroke_width, :opacity
      define_args :interactive, :updates, :interval_x, :interval_y, :padding
    end

    class Math_label < LayerBase
      define_args :dx, :dy, :width, :height, :x_align, :y_align, :color, :rotate, :margin
    end

    class Row < LayerBase
      define_args :percent
    end

    class Stage < LayerBase
      define_args :width, :height
    end

    class Wheel_zoom < LayerBase
      define_args :updates, :width, :height
    end

    class Y_tooltip < LayerBase
      define_args :targets, :target_types, :xlabels, :ylabels
    end
  end
end
