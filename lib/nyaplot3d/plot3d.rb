module Nyaplot
  class Plot3D
    include Jsonizable

    define_properties(:diagrams, :extension)
    define_group_properties(:options, [:width, :height])

    def initialize
      init_properties
      set_property(:diagrams, [])
      set_property(:options, {})
      set_property(:extension, 'Elegans')
    end

    def add(type, *data)
      df = DataFrame.new({x: data[0], y: data[1], z: data[2]})
      return add_with_df(df, type, :x, :y, :z)
    end

    def add_with_df(df, type, *labels)
      diagram = Diagram3D.new(df, type, labels)
      diagrams = get_property(:diagrams)
      diagrams.push(diagram)
      return diagram
    end

    def show
      frame = Frame.new
      frame.add(self)
      frame.show
    end

    def df_list
      diagrams = get_property(:diagrams)
      return diagrams.map{|d| next d.df_name}
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end
  end
end
