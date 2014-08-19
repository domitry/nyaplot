module Nyaplot

  # Diagram3D
  # @abstract extended using a module included in Nyaplot::Diagrams3D
  class Diagram3D
    include Jsonizable

    define_properties(:type, :data)

    def initialize(df, type, labels)
      init_properties
      mod = Kernel.const_get("Nyaplot").const_get("Diagrams3D").const_get(type.to_s.capitalize)
      self.extend(mod)
      set_property(:type, type)
      set_property(:options, {})
      set_property(:data, df.name)
      self.process_data(df, labels)
      DataBase.instance.add(df)
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end

    # @return [String] the name of dataframe from which this diagram is generated
    def df_name
      get_property(:data)
    end
  end

  module Diagrams3D
    module MatrixType
      include Jsonizable
      define_group_properties(:options, [:x, :y, :z])

      def process_data(df, labels)
        self.x(labels[0])
        self.y(labels[1])
        self.z(labels[2])
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
      # @!attribute fill_colors
      #   @return [Array<String>] colors which surface is filled in
      # @!attribute has_legend
      #   @return [Boolean] decide whether to add legend
      define_group_properties(:options, [:fill_colors, :has_legend])
    end

    module Wireframe
      include Jsonizable
      include MatrixType
      # @!attribute name
      #   @return [String] the name of the plot
      # @!attribute color
      #   @return [String] the color which lines are filled in
      # @!attribute thickness
      #   @return [Numeric] the thickness of lines
      # @!attribute has_legend
      #   @return [Boolean] decide whether to add legend
      define_group_properties(:options, [:name, :color, :thickness, :has_legend])
    end

    module Particles
      include Jsonizable
      include ArrayType
      # @!attribute name
      #   @return [String] the name of the plot
      # @!attribute color
      #   @return [String] the color which particles are filled in
      # @!attribute size
      #   @return [Numeric] the size of particles
      # @!attribute has_legend
      #   @return [Boolean] decide whether to add legend
      define_group_properties(:options, [:name, :color, :size, :has_legend])
    end

    module Scatter
      include Jsonizable
      include ArrayType
      # @!attribute name
      #   @return [String] the name of the plot
      # @!attribute shape
      #   @return [String] the shape of symbols. “circle”, “cross”, “rect”, and “diamond” are allowed.
      # @!attribute size
      #   @return [Numeric] the size of symbols
      # @!attribute stroke_color
      #   @return [String] stroke color
      # @!attribute stroke_width
      #   @return [Numeric] the thickness of the stroke
      # @!attribute fill_color
      #   @return [String] the color which symbols are filled in
      # @!attribute has_legend
      #   @return [Boolean] decide whether to add legend
      define_group_properties(:options, [:name, :shape, :size, :stroke_color, :stroke_width, :fill_color, :has_legend])
    end

    module Line
      include Jsonizable
      include ArrayType
      # @!attribute name
      #   @return [String] the name of the plot
      # @!attribute color
      #   @return [String] the color which lines are filled in
      # @!attribute thickness
      #   @return [Numeric] the thickness of lines
      # @!attribute has_legend
      #   @return [Boolean] decide whether to add legend
      define_group_properties(:options, [:name, :colors, :thickness, :has_legend])
    end
  end
end
