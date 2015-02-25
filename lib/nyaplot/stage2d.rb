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

    def adjust_size(width, height)
      [[:width, width], [:height, height]].each do |val|
        name, base = val
        if @axis.send(name).nil?
          @axis.send(name, (val = @background.send(name)).nil? ? base : val)
        end
        @background.send(name, @axis.send(name)) if @background.send(name).nil?
      end
    end

    def adjust_margin
    end

    def resolve_dependency
      child_width, child_height = [width*0.9, height*0.9]

      adjust_size(child_width, child_height)
      adjust_margin

      x_pad, y_pad = [child_width*0.05, child_height*0.05]
      xscale = @context.xscale([x_pad, child_width - x_pad])
      yscale = @context.yscale([child_height - y_pad, y_pad])

      pos = Position2D.new(x: xscale, y: yscale)

      @context.position(pos)
      @axis.xscale(xscale).yscale(yscale)
    end
  end
end
