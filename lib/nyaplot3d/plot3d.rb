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
      diagram = Diagram3D.new(type, data)
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
