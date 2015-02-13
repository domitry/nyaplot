module Nyaplot
  # the wrapper class for stage2d of Nyaplotjs
  # (https://github.com/domitry/Nyaplotjs/blob/v2/src/parser/stage2d.js)
  #
  class Stage2D
    include Nyaplot::Base
    type :stage2d
    required_args :sheets
    optional_args :margin, :width, :height

    def initialize(*sheets)
      self.sheets sheets
    end
  end
end
