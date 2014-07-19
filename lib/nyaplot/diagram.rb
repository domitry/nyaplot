module Nyaplot
  class Diagram
    include Jsonizable

    define_properties(:type, :data)

    def initialize(df, type, labels)
      init_properties
      mod = Kernel.const_get("Nyaplot").const_get("Diagrams").const_get(type.to_s.capitalize)
      self.extend(mod)
      set_property(:type, type)
      set_property(:options, {})
      set_property(:data, df.name)
      self.proceed_data(df, labels)
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

      def proceed_data(df, labels)
        case labels.length
        when 1
          label = labels[0]
          value(label)
          @xrange = df[label].to_a.uniq
          @yrange = [0, df[label].to_a.length]
        when 2
          label_x = labels[0]
          label_y = labels[1]
          x(label_x)
          y(label_y)
          @xrange = df.column(label_x).to_a
          @yrange = [(df[label_y].to_a.min < 0 ? df[label_y].to_a.min : 0), df[label_y].to_a.max]
        end
      end

      def zoom?
        false
      end
    end

    module Histogram
      include Jsonizable
      define_group_properties(:options, [:title, :value, :bin_num, :width, :color, :stroke_color, :stroke_width])

      def proceed_data(df, labels)
        label = labels[0]
        value(label)
        @xrange = [(df[label].to_a.min < 0 ? df[label].to_a.min : 0), df[label].to_a.max]
        @yrange = [0, df[label].to_a.length]
      end

      def zoom?
        false
      end
    end

    module Venn
      include Jsonizable
      define_group_properties(:options, [:title, :category, :count, :area_names, :filter_control, :opacity, :color, :stroke_color, :stroke_width])

      def proceed_data(df, labels)
        category(labels[0])
        count(labels[1])
        @xrange = [0, 10]
        @yrange = [0, 10]
      end

      def zoom?
        false
      end
    end

    module Scatter
      include Jsonizable
      define_group_properties(:options, [:title, :x, :y, :tooltip_contents, :r, :shape, :color, :stroke_color, :stroke_width])

      def proceed_data(df, labels)
        label_x = labels[0]
        label_y = labels[1]
        x(label_x)
        y(label_y)
        @xrange = [df[label_x].to_a.min, df[label_x].to_a.max]
        @yrange = [df[label_y].to_a.min, df[label_y].to_a.max]
      end

      def zoom?
        true
      end
    end

    module Line
      include Jsonizable
      define_group_properties(:options, [:title, :x, :y, :color, :stroke_width])

      def proceed_data(df, labels)
        label_x = labels[0]
        label_y = labels[1]
        x(label_x)
        y(label_y)
        @xrange = [df[label_x].to_a.min, df[label_x].to_a.max]
        @yrange = [df[label_y].to_a.min, df[label_y].to_a.max]
      end

      def zoom?
        true
      end
    end

    module Box
      include Jsonizable
      define_group_properties(:options, [:title, :value, :width, :color, :stroke_color, :stroke_width, :outlier_r])

      def proceed_data(df, labels)
        value(labels)
        yrange = [Float::INFINITY, -Float::INFINITY]

        proc = Proc.new do |column|
          yrange[0] = [yrange[0], column.min].min
          yrange[1] = [yrange[1], column.max].max
        end

        raw_data = labels.map{|label| df[label].to_a}
        raw_data.each{|column| proc.call(column)}
        @xrange = labels
        @yrange = yrange
      end

      def zoom?
        false
      end
    end
  end
end
