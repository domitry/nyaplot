module Nyaplot
  module Sheet

  class Context
    include Nyaplot::Base
    type :context2d
    required_args :glyphs
    optional_args :width, :height
  end

  class Axis
    include Nyaplot::Base
    type :axis2d
    required_args :xscale, :yscale, :width, :height
    optional_args :margin, :stroke_color, :stroke_width, :grid
  end

  class Background
    include Nyaplot::Base
    type :background2d
    required_args :width, :height
    optional_args :bg_color, :stroke_width, :stroke_color
  end
end
