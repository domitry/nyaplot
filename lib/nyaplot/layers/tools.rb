module Nyaplot
  module Layers
    class Accessor < LayerBase
      define_args :scale, :label, :type
    end

    class D2c < LayerBase
      define_args :label, :scale
    end

    class Data < LayerBase
      define_args :data
    end

    class Position2d < LayerBase
      define_args :x, :y
    end

    class Scale < LayerBase
      define_args :domain, :range, :type
    end
  end
end
