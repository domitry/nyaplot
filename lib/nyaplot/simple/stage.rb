module Nyaplot
  module Simple
    class DefaultStage < Stage2D
      def initialize(width=500, height=500)
        @width = width; @height = height
        @background = Nyaplot::Sheet::Background.new
        @context = Nyaplot::Sheet::Context.new
        @axis = Nyaplot::Sheet::Axis.new
        super(background, context, axis)
      end

      def adjust_size
        [@background, @context, @axis].each do |sheet|
          sheet.width
          sheet.height
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
end
