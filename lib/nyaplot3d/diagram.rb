module Nyaplot
  module Diagrams
    module MatrixType
      include Jsonizable
      define_group_properties(:options, [:x, :y, :z])

      def proceed_data(df=nil, data)
        case data.length
        when 3
          if df == nil
            df = DataFrame.new({x: data[0].flatten, y: data[1].flatten, z: data[2].flatten})
            x(:x)
            y(:y)
            z(:z)
          else
            x(data[0])
            y(data[1])
            z(data[2])
          end
          return df
        end
      end
    end

    module ArrayType
      include Jsonizable
      define_group_properties(:options, [:x, :y, :z])

      include MatrixType # this line will change when it supports more data format
    end

    module Surface
      include Jsonizable
      include MatrixType
      define_group_properties(:options, [:fill_colors, :has_legend])
    end

    module Wireframe
      include Jsonizable
      include MatrixType
      define_group_properties(:options, [:name, :color, :thickness, :has_legend])
    end

    module Particles
      include Jsonizable
      include ArrayType
      define_group_properties(:options, [:name, :color, :size, :has_legend])
    end

    module Scatter
      include Jsonizable
      include ArrayType
      define_group_properties(:options, [:name, :shape, :size, :stroke_color, :stroke_width, :fill_color, :has_legend])
    end

    module Line
      include Jsonizable
      include ArrayType
      define_group_properties(:options, [:name, :colors, :thickness, :has_legend])
    end
  end
end
