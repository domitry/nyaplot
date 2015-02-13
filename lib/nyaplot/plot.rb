module Nyaplot
  class Plot
    def initialize
      @pane = Nyaplot::Pane.new
      @stages = []
      @glyphs = []
      @reciever = self
    end

    # shortcut method for Nyaplot::Plot#add
    # @example
    #   Plot.add(:scatter, a, b)
    #
    def self.add(*args)
      Nyaplot::Plot.new.add(*args)
    end

    # Add glyph, sheet or stage to Plot
    def add(*args)
      if args.first.is_a? Symbol
        glyph = Nyaplot::Glyph.instantiate(*args)
        add_glyph(glyph)
      else
        args.each do |obj|
          if obj.is_a? Nyaplot::Glyph
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
      if @stages.length == 0
        stage = Nyaplot::Stage2D.new
        add_stage(stage)
        stage.add(glyph)
      elsif @stages.length == 1
        @stages.add(glyph)
      else
        raise "Specify stage to add the glyph."
      end
      @reciever = glyph
      @glyphs.push(glyph)
    end

    private
    def add_stage(stage)
      @pane
      @stages.push(stage)
      @reciever = stage
    end

    # shortcut method for method chaining
    # @example
    # Plot.add(df, :scatter, :x, :y)
    #  .color red
    #  .fill_by :fill
    #  .stage
    #  .width 500
    #  .height 500
    #
    def stage
      @reciever = @stages.first
      self
    end

    # shortcut method for method chaining
    def glyph
      @reciever = @glyphs.first
      self
    end

    def to_s
      "#<Nyaplot::Plot : "+"reciever="+@receiver.to_s+" : "+("%x"%(self.object_id << 1))+">"
    end

    def method_missing(name, *args)
      @reciever.send(name, *args) if @reciever.respond_to? name
      super
    end

    # generate model
    def to_json
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
  end
end
