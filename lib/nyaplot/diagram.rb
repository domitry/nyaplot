module Nyaplot
  class Diagram
    include Jsonizable

    define_properties(String, :type, :data)

    def initialize(type, data)
      set_property(:type, type)
      mod = Kernel.const_get("Nyaplot").const_get("Diagrams").const_get(type.to_s.capitalize)
      self.extend(mod)
      df = self.proceed_data(data)
      frame = Frame.instance
      frame.register_data(df)
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end
  end

  module Diagrams
    module Bar
      def extended
        define_group_properties(:options, [:value, :x, :y, :width, :color])
      end

      def proceed_data(data)
        case data.length
        when 1
          df = DataFrame.new({value: data[0]})
          set_property(:data, df.name)
          set_property(:value, 'value')
          return df
        when 2
          df = DataFrame.new({x: data[0], y: data[1]})
          set_property(:data, df.name)
          set_property(:x, 'x')
          set_property(:y, 'y')
          return df
        end
      end
    end

    module Histogram
      def extended
        define_group_properties(:options, [:title, :value, :bin_num, :width, :color, :stroke_color, :stroke_width])
      end

      def proceed_data(data)
        df = DataFrame.new({value: data[0]})
        set_property(:data, df.name)
        set_property(:value, 'value')
        return df
      end
    end

    module Venn
      def extended
        define_group_properties(:options, [:title, :category, :count, :area_names, :filter_control, :opacity, :color, :stroke_color, :stroke_width])
      end

      def proceed_data(data)
        df = DataFrame.new({category: data[0], count: data[1]})
        set_property(:data, df.name)
        set_property(:category, 'category')
        set_property(:count, 'count')
        return df
      end
    end

    module Scatter
      def extended
        define_group_properties(:options, [:title, :x, :y, :r, :shape, :color, :stroke_color, :stroke_width])
      end

      def proceed_data(data)
        df = DataFrame.new({x: data[0], y: data[1]})
        set_property(:data, df.name)
        set_property(:x, 'x')
        set_property(:y, 'y')
        return df
      end
    end

    module Line
      def extended
        define_group_properties(:options, [:title, :value, :color, :stroke_width])
      end

      def proceed_data(data)
        df = DataFrame.new({x: data[0], y: data[1]})
        set_property(:data, df.name)
        set_property(:x, 'x')
        set_property(:y, 'y')
        return df
      end
    end
  end
end
