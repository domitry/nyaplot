module Nyaplot
  module Sheet
    # Root class for glyphs
    class Context
      include Nyaplot::Base
      type :context2d
      required_args :glyphs
      optional_args :width, :height

      def add_glyph(*glyph)
        glyphs([]) if glyphs.nil?
        glyph = glyph.map{|g| g.uuid}
        glyphs.concat(glyph)
        add_dependency(*glyph)
      end

      private
      def range(method_name)
        return glyphs.reduce([Infinity, -Infinity]) do |memo, glyph|
          min, max = glyphs.send(method_name)
          memo[0] = [min, memo[0]].min
          memo[1] = [max, memo[0]].max
        end
      end

      private
      def xscale
        r = self.range(:range_x)
        s = Scale.new(domain: r, range: [0, width])
        s.type = (r.all? {|v| v.is_a? Numeric} ? :linear : :ordinal)
        s
      end

      private
      def yscale
        r = self.range(:range_y)
        s = Scale.new(domain: r, range: [0, height])
        s.type = (r.all? {|v| v.is_a? Numeric} ? :linear : :ordinal)
        s
      end

      def position
        Position2D.new(x: xscale, y: yscale)
      end


    class Background
      include Nyaplot::Base
      type :background2d
      required_args :width, :height
      optional_args :bg_color, :stroke_width, :stroke_color
    end
  end
end
