module Nyaplot
  module Layers
    class Html_column << LayerBase
    end

    class Html_row << LayerBase
    end

    class Widget << LayerBase
      define_args :fname, :svg
    end
  end
end
