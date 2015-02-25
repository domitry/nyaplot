module Nyaplot
  class RowScale
    include Nyaplot::Base
    type :row_scale
    required_args :data, :column, :range
  end

  class DataFrameScale
    include Nyaplot::Base
    type :df_scale
    required_args :data, :column, :range
  end

  class Scale
    include Nyaplot::Base
    type :scale
    required_args :domain, :range, :type
  end
end
