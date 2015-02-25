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
      super()
      attr(width: 500, height: 400)
      @background = Nyaplot::Sheet::Background.new
      @context = Nyaplot::Sheet::Context.new
      @axis = Nyaplot::Sheet::Axis.new
      add_sheet(@background, @axis, @context)
    end

    def add_sheet(*given)
      sheets([]) if sheets.nil?
      sheets.concat(given.map{|obj| obj.uuid})
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

    def resolve_dependency
      adjust_size
      adjust_margin

      xscale = @context.xscale([0, width])
      yscale = @context.yscale([0, height])
      pos = Position2D.new(x: xscale, y: yscale)

      @context.position(pos)
      @axis.xscale(xscale).yscale(yscale)
    end
  end
end
