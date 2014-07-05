module Nyaplot
  class Diagram
    include Jsonizable

    define_properties(String, :type, :data)

    def initialize(type, data)
      set_property(:type, type)
      mod = Kernel.const_get("Nyaplot").const_get("Diagrams").const_get(type.to_s.capitalize)
      self.extend(mod)
      df = self.proceed_data(data)
      DataBase.instance.add(df)
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end

    def xrange
      @xrange
    end

    def yrange
      @yrange
    end

    def df_name
      get_property(:data)
    end
  end

  module Diagrams
    module Bar
      include Jsonizable
      define_group_properties(:options, [:value, :x, :y, :width, :color])

      def proceed_data(data)
        case data.length
        when 1
          df = DataFrame.new({value: data[0]})
          set_property(:data, df.name)
          value('value')
          @xrange = df.value.uniq
          @yrange = [0, df.value.length]
          return df
        when 2
          df = DataFrame.new({x: data[0], y: data[1]})
          set_property(:data, df.name)
          x('x')
          y('y')
          @xrange = df.x
          @yrange = [(df.y.min < 0 ? df.y.min : 0), df.y.max]
          return df
        end
      end
    end

    module Histogram
      include Jsonizable
      define_group_properties(:options, [:title, :value, :bin_num, :width, :color, :stroke_color, :stroke_width])

      def proceed_data(data)
        df = DataFrame.new({value: data[0]})
        set_property(:data, df.name)
        value('value')
        @xrange = [df.value.min, df.value.max]
        @yrange = [0, df.value.length]
        return df
      end
    end

    module Venn
      include Jsonizable
      define_group_properties(:options, [:title, :category, :count, :area_names, :filter_control, :opacity, :color, :stroke_color, :stroke_width])

      def proceed_data(data)
        df = DataFrame.new({category: data[0], count: data[1]})
        set_property(:data, df.name)
        category('category')
        count('count')
        @xrange = [0, 10]
        @yrange = [0, 10]
        return df
      end
    end

    module Scatter
      include Jsonizable
      define_group_properties(:options, [:title, :x, :y, :r, :shape, :color, :stroke_color, :stroke_width])

      def proceed_data(data)
        df = DataFrame.new({x: data[0], y: data[1]})
        set_property(:data, df.name)
        x('x')
        y('y')
        @xrange = [df.x.min, df.x.max]
        @yrange = [df.y.min, df.y.max]
        return df
      end
    end

    module Line
      include Jsonizable
      define_group_properties(:options, [:title, :x, :y, :color, :stroke_width])

      def proceed_data(data)
        df = DataFrame.new({x: data[0], y: data[1]})
        set_property(:data, df.name)
        x('x')
        y('y')
        @xrange = [df.x.min, df.x.max]
        @yrange = [df.y.min, df.y.max]
        return df
      end
    end
  end
end
