module Nyaplot
  # Base module for Plot-something of Nyaplot. (e.g. Nyaplot::Plot2D or Nyaplot::Plot)
  # Plot have one root named "pane".
  # Plot resolve dependency according to pane, create model, and generate html code according to it.
  module PlotBase
    def initialize(*args)
      @pane = Nyaplot::Pane.new
    end

    # generate model
    def to_json(*args)
      gen = 0; gen_list = {}
      stack = [@pane]

      while stack.length > 0
        stack = stack.reduce([]) do |memo, obj|
          gen_list[obj] = gen
          memo.concat(obj.dependency)
          next memo
        end
        gen += 1
      end

      # gen_list: {Obj1: 2, Obj2: 0, Obj3: 15, .., Objn: 0}
      return gen_list.sort_by {|k, v| v}.map {|arr| arr.first}.to_json
    end

    # generate html code for <body> tag
    def generate_body
      path = File.expand_path("../templates/iruby.erb", __FILE__)
      template = File.read(path)
      id = SecureRandom.uuid()
      model = self.to_json
      ERB.new(template).result(binding)
    end

    # generate static html file
    # @return [String] generated html
    def generate_html
      body = generate_body
      init = Nyaplot.generate_init_code
      path = File.expand_path("../templates/static_html.erb", __FILE__)
      template = File.read(path)
      ERB.new(template).result(binding)
    end

    # export static html file
    def export_html(path="./plot.html")
      path = File.expand_path(path, Dir::pwd)
      str = generate_html
      File.write(path, str)
    end

    # show plot automatically on IRuby notebook
    def to_iruby
      html = generate_body
      ['text/html', html]
    end

    # show plot on IRuby notebook
    def show
      IRuby.display(self)
    end

    # shortcut method for Nyaplot::Plot#add
    # @example
    #   Plot.add(:scatter, a, b)
    #
    class << self
      def add(*args)
        self.new.add(*args)
      end

      def from(df)
        self.new.from(df)
      end
    end
  end

  # Base class for general 2-dimentional plots
  # Plot2D have one pane, some stage2ds and glyphs
  class Plot2D
    include PlotBase
    attr_accessor :pane, :stages, :glyphs

    def initialize
      super
      @dependency = [@pane]
    end

    # shortcut method for
    # @example
    #   df = DataFrame.new({hoge: [1,2,3], nya: [2,3,4]})
    #   Plot.from(df).add(:scatter, :hoge, :nya)
    #
    def from(df)
      if df.is_a? DataFrame
        @df = df
        self
      else
        raise ""
      end
    end

    # Add glyph, sheet or stage to Plot
    # @example
    #    Plot.add(:scatter, x, y)
    #    Plot.add(sc)
    #
    def add(*args)
      if args.first.is_a? Symbol
        name = args.shift
        raise "invalid arguments" unless args.length == 1 && args.first.is_a? Hash
        if (hash = args.first) && hash.all?{|k, v| v.is_a? Symbol}
          glyph = Nyaplot::Glyph.instantiate(@df, name, hash)
        else
          # hash: {x: [0, 1, 2], y: [1, 2, 3]}
          df = DataFrame.new(hash)
          arg = hash.reduce({}){|memo, k, v| memo[k] = k; memo}
          glyph = Nyaplot::Glyph.instantiate(df, name, arg)
        end
        add_glyph(glyph)
      else
        args.each do |obj|
          if obj.is_a? Nyaplot::Glyph2D
            add_glyph(obj)
          elsif obj.is_a? Nyaplot::Stage2D
            add_stage(obj)
          end
        end
      end
      self
    end

    private
    def add_glyph(glyph)
      stages = @dependency.select{|obj| obj.is_a? Stage2D}
      if stage_num == 0
        stage = Stage2D.new
        self.add_stage(stage)
        stage.context.add(glyph)
      elsif stage_num == 1
        stages.first.context.add(glyph)
      else
        raise "Specify stage to add the glyph."
      end
      @dependency.push(glyph)
    end

    private
    def add_stage(stage)
      @pane = Pane.columns(@pane, stage)
      @dependency.push(stage)
    end

    def method_missing(name, *args)
      @dependency.each do |obj|
        break obj.send(name, *args) if obj.respond_to? name
      end
      super
    end
  end

  # shortcut for Nyaplot::Plot2D
  class Plot < Plot2D
  end
end
