module Nyaplot
  module Charts
    class ChartBase
      class << self
        def allow(x, y)
          @@allow_x = x
          @@allow_y = y
        end

        def need(*args)
          @@needs = args
        end
      end

      attr_reader :glyphs, :deps
      def initialize(**opts)
        @glyphs = []
        @deps = []

        @@needs.each do |sym|
          raise "lack argument" if opts[sym].nil?
        end
        
        create(**opts)
      end

      def create
        ## over-write this
      end

      private
      def add_dependency(layer)
        @deps.push(layer)
        layer
      end
      alias :ad :add_dependency

      private
      def add_glyph(glyph)
        @glyphs.push(glyph)
        glyph
      end
      alias :ag :add_glyph

      private
      def create_ordinal_position(xscale, yscale, label, xy=:x)
        scale = xy==:x ? xscale : yscale
        d2c = ad Layers::D2c.new({scale: scale, label: label})
        arg = {x: xscale, y: yscale}
        arg[xy] = d2c
        ad Layers::Position2d.new(arg)
      end
    end
  end
end
