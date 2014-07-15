module Nyaplot
  class Diagram
    include Jsonizable

    define_properties(String, :type, :data)

    def initialize(type, data)
      set_property(:type, type)
      mod = Kernel.const_get("Nyaplot").const_get("Diagrams").const_get(type.to_s.capitalize)
      self.extend(mod)
      df = self.proceed_data(data)
      set_property(:data, df.name)
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
          if data[0].is_a? Series
            df = data[0].parent
            label = data[0].label
          else
            df = DataFrame.new({value: data[0]})
            label = 'value'
          end
          value(label)
          @xrange = df[label].to_a.uniq
          @yrange = [0, df[label].to_a.length]
          return df
        when 2
          if data[0].is_a?(Series) && data[1].is_a?(Series)
            df = data[0].parent
            label_x = data[0].label
            label_y = data[1].label
          else
            df = DataFrame.new({x: data[0], y: data[1]})
            label_x = 'x'
            label_y = 'y'
          end
          x(label_x)
          y(label_y)
          @xrange = df.column(label_x).to_a
          @yrange = [(df[label_y].to_a.min < 0 ? df[label_y].to_a.min : 0), df[label_y].to_a.max]
          return df
        end
      end
    end

    module Histogram
      include Jsonizable
      define_group_properties(:options, [:title, :value, :bin_num, :width, :color, :stroke_color, :stroke_width])

      def proceed_data(data)
          if data[0].is_a? Series
            df = data[0].parent
            label = data[0].label
          else
            df = DataFrame.new({value: data[0]})
            label = 'value'
          end
          value(label)
          @xrange = [(df[label].to_a.min < 0 ? df[label].to_a.min : 0), df[label].to_a.max]
          @yrange = [0, df[label].to_a.length]
          return df
      end
    end

    module Venn
      include Jsonizable
      define_group_properties(:options, [:title, :category, :count, :area_names, :filter_control, :opacity, :color, :stroke_color, :stroke_width])

      def proceed_data(data)
        df = DataFrame.new({category: data[0], count: data[1]})
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
        if data[0].is_a? Series
          df = data[0].parent
          label_x = data[0].label
          label_y = data[1].label
        else
          df = DataFrame.new({x: data[0], y: data[1]})
          label_x = 'x'
          label_y = 'y'
        end
        x(label_x)
        y(label_y)
        @xrange = [df[label_x].to_a.min, df[label_x].to_a.max]
        @yrange = [df[label_y].to_a.min, df[label_y].to_a.max]
        return df
      end
    end

    module Line
      include Jsonizable
      define_group_properties(:options, [:title, :x, :y, :color, :stroke_width])

      def proceed_data(data)
        if data[0].is_a? Series
          df = data[0].parent
          label_x = data[0].label
          label_y = data[1].label
        else
          df = DataFrame.new({x: data[0], y: data[1]})
          label_x = 'x'
          label_y = 'y'
        end
        x(label_x)
        y(label_y)
        @xrange = [df[label_x].to_a.min, df[label_x].to_a.max]
        @yrange = [df[label_y].to_a.min, df[label_y].to_a.max]
        return df
      end
    end

    module Box
      include Jsonizable
      define_group_properties(:options, [:title, :value, :width, :color, :stroke_color, :stroke_width, :outlier_r])

      def proceed_data(data)
        yrange = [Float::INFINITY, -Float::INFINITY]

        proc = Proc.new do |column|
          yrange[0] = [yrange[0], column.min].min
          yrange[1] = [yrange[1], column.max].max
        end

        if (data.length == 1) && (data[0].is_a? DataFrame)
          df = data[0]
          @xrange = df.column_labels
          df.each_column(proc)
        elsif data.all? {|d| d.is_a? Series}
          df = data[0].parent
          @xrange = data.map {|d| d.label}
          columns = data.map {|d| d.to_a}
          columns.each(&proc)
        else
          labels = Array.new(data.length, 'data').map.with_index{|label, i| label.clone.concat(i.to_s)}
          raw = data.inject({}){|hash, d| hash[labels.pop] = d; next hash}
          df = DataFrame.new(raw)
          @xrange = df.column_labels
          df.each_column(&proc)
        end
        @yrange = yrange
        value @xrange
        return df
      end
    end
  end
end
