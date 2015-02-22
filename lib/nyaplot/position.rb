module Nyaplot
  class Position2D
    include Nyaplot::Base
    type :position2d
    required_args :x, :y
  end
end
