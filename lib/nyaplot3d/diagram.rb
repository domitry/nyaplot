module Nyaplot
  class Diagram3D
    include Jsonizable

    define_properties(:type, :data)

    def initialize(df, type, data)
      init_properties
      mod = Kernel.const_get("Nyaplot").const_get("Diagrams3D").const_get(type.to_s.capitalize)
      self.extend(mod)
      set_property(:type, type)
      set_property(:options, {})
      set_property(:data, df.name)
      df = self.proceed_data(data)
      DataBase.instance.add(df)
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end

    def df_name
      get_property(:data)
    end
  end

  module Diagrams3D
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
