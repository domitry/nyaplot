module Nyaplot
  module Interactive
    @@callbacks = {}

    def init_interactive_layer
      path = File.expand_path("../templates/init_interactive.js", __FILE__)
      js = File.read(path)
      IRuby.display(IRuby.javascript(js))
    end

    def self.included(cls)
      init_interactive_layer
      @@comm = IRuby::Comm.new("nyaplot_interactive")
      @@comm.open
      on_msg = Proc.new do |msg|
        # msg: {type: "selected", uuid: , range: [0, 100]}
        if msg[:type] == "selected"
          cb = @@callbacks[msg[:uuid]]
          cb.call(msg[:range])
        end
      end
      @@comm.on_msg(on_msg)
      @@comm.send({type: "hello"})
    end
  end

  class Plot2D
    def update
      msg = {
        type: update,
        model: self.to_json
      }
      @@comm.send(msg)
    end
  end

  class Filter
    include Nyaplot::Base
    required_args :scalex, :scaley, :uuid
    optional_args :opacity, :color
    type :interactive_layer
  end

  class Plot2D
    def add_filter(&block)
      if (stages = @pane.dependency.select{|d| d.is_a?(Nyaplot::Stage2D)}).length == 1
        stages.first.add_filter(&block)
      else
        raise "specify stage to add filter."
      end
    end
  end

  class Stage2D
    def add_filter(&block)
      @filter = Filter.new(uuid: @uuid)
      add_sheet(@filter)
      @@callbacks[@filter.uuid] = block
    end

    def before_to_json
      unless @filter.nil?
        xscale = @axis.xscale
        yscale = @axis.yscale
        @filter.scalex(xscale).scaley(yscale)
      end
    end
  end
end
