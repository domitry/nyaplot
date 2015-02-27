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
      comm_id = SecureRandom.hex(16)
      @@comm = IRuby::Comm.new("nyaplot_interactive", comm_id)
      @@comm.open
      IRuby::Kernel.instance.register_comm(comm_id, @@comm)

      on_msg = Proc.new do |msg|
        content = msg
        # msg: {type: "selected", uuid: , range: [0, 100]}
        if content[:type.to_s] == "selected"
          cb = @@callbacks[content[:stage_uuid.to_s]]
          cb.call(content[:range.to_s])
        end
      end
      @@comm.on_msg(on_msg)
      @@comm.send({type: "hello"})
    end
  end

  class Filter
    include Nyaplot::Base
    required_args :scalex, :scaley, :stage_uuid
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
      @filter = Filter.new(stage_uuid: @uuid)
      add_sheet(@filter)
      @@callbacks[@uuid] = block
    end

    def before_to_json
      unless @filter.nil?
        xscale = @axis.xscale
        yscale = @axis.yscale
        @filter.scalex(xscale).scaley(yscale)
      end
    end
  end

  class EmptyPlot
    include PlotBase

    def initialize(*args)
      @pane = args.select{|a| a.is_a?(Nyaplot::Pane)}.first
      args.delete(@pane)
      @others = args
    end

    def update
      # should be refactored
      old_pane_uuid = @pane.uuid
      msg = {
        type: :update,
        model: self.to_json
      }
      new_pane_uuid = @pane.uuid
      msg[:model].gsub!(new_pane_uuid, old_pane_uuid)
      @pane.uuid = old_pane_uuid
      @@comm.send(msg)
      STDERR.puts msg
    end

    def to_json(*args)
      gen_list = generate_gen_list(@others)
      list = gen_list.sort_by{|k, v| v}.map{|arr| arr.first.to_json}.reverse
      list.push(@pane.to_json)
      "[" + list.join(",") + "]"
    end
  end
end
