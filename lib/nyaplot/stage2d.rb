module Nyaplot
  # the wrapper class for stage2d of Nyaplotjs
  # (https://github.com/domitry/Nyaplotjs/blob/v2/src/parser/stage2d.js)
  #
  class Stage2D
    include Nyaplot::Base
    type :stage2d
    required_args :sheets
    optional_args :margin, :width, :height
    attr_accessor :background, :context, :axis

    def initialize(*args)
      attr({width: 700, height: 700})
      super
      @background = Nyaplot::Sheet::Background.new
      @context = Nyaplot::Context2D.new
      @axis = Nyaplot::Sheet::Axis.new
      add_sheet(@background, @context, @axis)
    end

    def add_sheet(*given)
      raise RuntimeError unless given.all? {|s| s.is_a? Nyaplot::Sheet}
      sheets([]) if sheets.nil?
      sheets.concat(given)
      add_dependency(*given)
    end

    def adjust_size
      [:width, :height].each do |name|
        if @axis.send(name).nil?
          @axis.send(name, (val = @background.send(name)).nil? ? self.send(name) : val)
        end
        @background.send(name, @axis.send(name)) if @background.send(name).nil?
      end
    end

    def adjust_margin
    end

    def before_to_json
      adjust_size
      adjust_margin
    end
  end
end
